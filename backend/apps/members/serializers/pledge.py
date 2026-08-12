from rest_framework import serializers

from apps.members.models.pledge import MemberPledge


class MemberPledgeSerializer(serializers.ModelSerializer):
    attachment = serializers.FileField(write_only=True, required=False, allow_null=True)
    download_url = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = MemberPledge
        fields = [
            "id",
            "member",
            "title",
            "description",
            "attachment",
            "original_name",
            "issue_date",
            "created_at",
            "created_by",
            "created_by_name",
            "download_url",
        ]
        read_only_fields = ["id", "original_name", "created_at", "created_by", "created_by_name"]

    def get_download_url(self, obj):
        if obj.attachment:
            return f"member-pledges/{obj.id}/download/"
        return None

    def create(self, validated_data):
        uploaded_file = validated_data.pop("attachment", None)
        request = self.context.get("request")
        created_by = request.user if request and request.user.is_authenticated else None

        original_name = uploaded_file.name if uploaded_file else ""
        instance = MemberPledge(
            **validated_data,
            attachment=uploaded_file,
            original_name=original_name,
            created_by=created_by,
        )
        instance.save()
        return instance
