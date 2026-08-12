from django.core.exceptions import ValidationError as DjangoValidationError

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.members.models import MemberDocument
from apps.members.utils.uploads import compute_sha256, sniff_content_type, validate_upload_size


class MemberDocumentSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)
    document_type_name = serializers.CharField(source="document_type.name_ar", read_only=True)
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = MemberDocument
        fields = [
            "id",
            "member",
            "document_type",
            "document_type_name",
            "title",
            "file",
            "original_name",
            "content_type",
            "file_size",
            "issue_date",
            "expiry_date",
            "is_current",
            "created_at",
            "download_url",
        ]
        read_only_fields = ["id", "original_name", "content_type", "file_size", "created_at"]

    @extend_schema_field(serializers.URLField())
    def get_download_url(self, obj):
        return f"documents/{obj.id}/download/"

    def validate_file(self, value):
        # Sniff here (during is_valid()) rather than in create() — a
        # django.core.exceptions.ValidationError raised inside create()
        # isn't caught by DRF and would surface as a raw 500, not a clean
        # 400. The result is stashed for create() so the file is only
        # read/sniffed once.
        validate_upload_size(value)
        try:
            self._sniffed_content_type, _ext = sniff_content_type(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages) from exc
        return value

    def create(self, validated_data):
        uploaded_file = validated_data.pop("file")
        content_type = self._sniffed_content_type
        sha256 = compute_sha256(uploaded_file)

        request = self.context.get("request")
        instance = MemberDocument(
            **validated_data,
            file=uploaded_file,
            original_name=uploaded_file.name,
            content_type=content_type,
            file_size=uploaded_file.size,
            sha256=sha256,
            uploaded_by=request.user if request and request.user.is_authenticated else None,
        )
        instance.save()
        return instance
