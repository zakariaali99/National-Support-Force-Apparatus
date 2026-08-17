from rest_framework import serializers

from apps.attendance.models import DailyAttendance, ShiftRosterGroup
from apps.members.models import Member


class ShiftRosterGroupSerializer(serializers.ModelSerializer):
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    pattern_display = serializers.CharField(
        source="get_pattern_display", read_only=True
    )
    members_count = serializers.IntegerField(
        source="members.count", read_only=True
    )
    member_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Member.objects.filter(is_deleted=False),
        source="members",
        required=False,
    )

    class Meta:
        model = ShiftRosterGroup
        fields = [
            "id",
            "faction",
            "faction_name",
            "name_ar",
            "code",
            "pattern",
            "pattern_display",
            "cycle_days",
            "work_days",
            "rest_days",
            "anchor_date",
            "group_offset",
            "start_time",
            "end_time",
            "shift_hours",
            "member_ids",
            "members_count",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class DailyAttendanceSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.full_name", read_only=True)
    force_number = serializers.CharField(
        source="member.force_number", read_only=True
    )
    faction_name = serializers.CharField(
        source="member.faction.name_ar", read_only=True
    )
    rank_name = serializers.CharField(
        source="member.rank.name_ar", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )
    expected_status_display = serializers.CharField(
        source="get_expected_status_display", read_only=True
    )

    class Meta:
        model = DailyAttendance
        fields = [
            "id",
            "member",
            "member_name",
            "force_number",
            "faction_name",
            "rank_name",
            "date",
            "status",
            "status_display",
            "expected_status",
            "expected_status_display",
            "check_in_time",
            "check_out_time",
            "late_hours",
            "early_departure_hours",
            "excused_hours",
            "deducted_vacation_days",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
            "deducted_vacation_days",
            "expected_status",
        ]


class SingleAttendanceInputSerializer(serializers.Serializer):
    member_id = serializers.IntegerField()
    status = serializers.ChoiceField(
        choices=[
            "present",
            "late",
            "early_departure",
            "excused_absence",
            "unexcused_absence",
            "shift_off",
            "vacation",
            "mission",
        ]
    )
    check_in_time = serializers.TimeField(required=False, allow_null=True)
    check_out_time = serializers.TimeField(required=False, allow_null=True)
    late_hours = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0.0
    )
    early_departure_hours = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0.0
    )
    excused_hours = serializers.DecimalField(
        max_digits=5, decimal_places=2, required=False, default=0.0
    )
    notes = serializers.CharField(required=False, allow_blank=True)


class BulkAttendanceRecordSerializer(serializers.Serializer):
    date = serializers.DateField()
    records = serializers.ListField(
        child=SingleAttendanceInputSerializer(), allow_empty=False
    )
