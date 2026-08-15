from rest_framework import serializers

from apps.members.models.vacation import VacationRequest, VacationTransaction


class VacationRequestSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    requested_by_name = serializers.CharField(source="requested_by.get_full_name", read_only=True)
    decided_by_name = serializers.CharField(source="decided_by.get_full_name", read_only=True)

    class Meta:
        model = VacationRequest
        fields = [
            "id",
            "member",
            "member_name",
            "start_date",
            "end_date",
            "days",
            "reason",
            "status",
            "requested_by",
            "requested_by_name",
            "decided_by",
            "decided_by_name",
            "decided_at",
            "created_at",
        ]
        # status/decided_by/decided_at are only ever changed by the
        # dedicated approve/reject actions (apps/members/views/vacation.py),
        # never a plain PATCH — mirrors Member.approval_status in Phase 2/6.
        read_only_fields = [
            "id",
            "status",
            "requested_by",
            "decided_by",
            "decided_at",
            "created_at",
        ]

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))
        if start and end and start > end:
            raise serializers.ValidationError("تاريخ بداية الإجازة يجب أن يسبق تاريخ نهايتها.")
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["requested_by"] = request.user
        return super().create(validated_data)


class VacationTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacationTransaction
        fields = ["id", "member", "days", "kind", "reason", "vacation_request", "created_by", "created_at"]
        read_only_fields = ["id", "kind", "vacation_request", "created_by", "created_at"]
