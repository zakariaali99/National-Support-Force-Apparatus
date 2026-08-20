import re

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from apps.members.models import Member
from apps.members.utils.arabic import normalize_digits
from apps.members.utils.uploads import process_photo, validate_upload_size


def _absolute_or_relative(request, path):
    return request.build_absolute_uri(path) if request else path


class MemberListSerializer(serializers.ModelSerializer):
    """Lighter shape for the paginated list view — avoids shipping every
    field (pledges, join_date, ...) for what's usually a table of 25-200 rows.
    """

    full_name = serializers.CharField(read_only=True)
    rank_name = serializers.CharField(source="rank.name_ar", read_only=True)
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    photo_thumb_url = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "full_name",
            "force_number",
            "national_number",
            "rank",
            "rank_name",
            "faction",
            "faction_name",
            "phone",
            "service_status",
            "approval_status",
            "photo_thumb_url",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_photo_thumb_url(self, obj):
        if not obj.photo_thumb:
            return None
        return _absolute_or_relative(self.context.get("request"), f"/api/members/{obj.id}/photo/?variant=thumb")


class MemberSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    national_number = serializers.CharField(max_length=12)
    force_number = serializers.CharField(max_length=50)
    rank_name = serializers.CharField(source="rank.name_ar", read_only=True)
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    photo_url = serializers.SerializerMethodField()
    photo_thumb_url = serializers.SerializerMethodField()
    photo_upload = serializers.ImageField(write_only=True, required=False, allow_null=True)
    # Placeholder until Phase 3's FieldRequirement model exists — always
    # empty for now so the frontend's "incomplete profile" badge has a
    # stable field to read from day one rather than needing a later
    # serializer reshape.
    missing_required_fields = serializers.SerializerMethodField()

    class Meta:
        model = Member
        fields = [
            "id",
            "first_name",
            "second_name",
            "third_name",
            "last_name",
            "full_name",
            "force_number",
            "national_number",
            "id_card_number",
            "passport_number",
            "date_of_birth",
            "place_of_birth",
            "blood_type",
            "mother_name",
            "current_residence",
            "nearest_landmark",
            "location_url",
            "latitude",
            "longitude",
            "rank",
            "rank_name",
            "faction",
            "faction_name",
            "phone",
            "pledges",
            "join_date",
            "approval_status",
            "service_status",
            "vacation_balance_days",
            "photo_url",
            "photo_thumb_url",
            "photo_upload",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "missing_required_fields",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "vacation_balance_days",
            # Approval is a workflow transition (Phase 6's dedicated
            # endpoint), not a plain field edit.
            "approval_status",
        ]

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_photo_url(self, obj):
        if not obj.photo:
            return None
        return _absolute_or_relative(self.context.get("request"), f"/api/members/{obj.id}/photo/")

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_photo_thumb_url(self, obj):
        if not obj.photo_thumb:
            return None
        return _absolute_or_relative(self.context.get("request"), f"/api/members/{obj.id}/photo/?variant=thumb")

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_missing_required_fields(self, obj):
        from apps.members.field_registry import FIELD_REGISTRY, get_requirement_overrides

        overrides = get_requirement_overrides()
        missing = []
        for field in FIELD_REGISTRY:
            key = field["key"]
            override = overrides.get(key)
            required = override.is_required if override else field["default_required"]
            if required and not getattr(obj, key, None):
                missing.append(key)
        return missing

    def to_internal_value(self, data):
        # Clean FormData/dict empty strings to avoid validation failures on dates/numbers
        if hasattr(data, "copy"):
            data = data.copy()
        elif isinstance(data, dict):
            data = dict(data)

        nullable_keys = ["date_of_birth", "join_date", "latitude", "longitude"]
        for key in nullable_keys:
            if key in data and data[key] == "":
                data[key] = None

        return super().to_internal_value(data)

    def validate_national_number(self, value):
        value = normalize_digits(value).strip()
        if not re.fullmatch(r"[0-9]{12}", value):
            raise serializers.ValidationError("الرقم الوطني يجب أن يتكون من 12 رقماً.")
        qs = Member.objects.filter(national_number=value, is_deleted=False)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("الرقم الوطني مسجل مسبقاً لفرد آخر في المنظومة.")
        return value

    def validate_force_number(self, value):
        value = normalize_digits(value).strip()
        if not value:
            raise serializers.ValidationError("الرقم الحربي مطلوب.")
        qs = Member.objects.filter(force_number=value, is_deleted=False)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("الرقم الحربي مسجل مسبقاً لفرد آخر في المنظومة.")
        return value

    def validate(self, attrs):
        # Settings > Field Requirements can mark an otherwise-optional field
        # (e.g. phone, blood_type) as required. Enforced only on create, and
        # on update only when the field is actually present in the payload —
        # tightening a requirement must never lock an existing incomplete
        # record out of being edited at all (see PLAN.md's Phase 3 notes).
        from apps.members.field_registry import FIELD_REGISTRY, get_requirement_overrides

        overrides = get_requirement_overrides()
        is_create = self.instance is None
        missing_labels = []
        for field in FIELD_REGISTRY:
            key = field["key"]
            if key not in self.fields:
                continue
            required = overrides[key].is_required if key in overrides else field["default_required"]
            if not required:
                continue
            if is_create:
                if not attrs.get(key):
                    missing_labels.append(field["label_ar"])
            elif key in attrs and not attrs[key]:
                missing_labels.append(field["label_ar"])
        if missing_labels:
            raise serializers.ValidationError(
                {"missing_required_fields": f"الحقول التالية مطلوبة: {'، '.join(missing_labels)}"}
            )
        return attrs

    def validate_photo_upload(self, value):
        if value is not None:
            validate_upload_size(value)
        return value

    def _apply_photo(self, instance, photo_file):
        if photo_file is None:
            return
        try:
            main_file, thumb_file = process_photo(photo_file)
            instance.photo.save("photo.jpg", main_file, save=False)
            instance.photo_thumb.save("photo_thumb.jpg", thumb_file, save=False)
        except Exception as exc:
            raise serializers.ValidationError({"photo_upload": f"تعذر حفظ الصورة الشخصية: {str(exc)}"})

    def create(self, validated_data):
        photo_file = validated_data.pop("photo_upload", None)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
            validated_data["updated_by"] = request.user
        instance = Member(**validated_data)
        self._apply_photo(instance, photo_file)
        instance.save()
        return instance

    def update(self, instance, validated_data):
        photo_file = validated_data.pop("photo_upload", None)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["updated_by"] = request.user
        for field, value in validated_data.items():
            setattr(instance, field, value)
        self._apply_photo(instance, photo_file)
        instance.save()
        return instance
