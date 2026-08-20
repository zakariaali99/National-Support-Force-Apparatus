from datetime import date, datetime
from decimal import Decimal

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.attendance.models import DailyAttendance, ShiftRosterGroup
from apps.attendance.serializers import (
    BulkAttendanceRecordSerializer,
    DailyAttendanceSerializer,
    ShiftRosterGroupSerializer,
)
from apps.attendance.services.rotation import ShiftRotationService
from apps.core.activity import log_activity
from apps.core.permissions.classes import HasPermission
from apps.members.models import Member

STATUS_AR_LABELS = {
    "present": "حاضر",
    "late": "متأخر",
    "early_departure": "انصراف مبكر",
    "excused_absence": "غياب بإذن",
    "unexcused_absence": "غياب بدون إذن",
    "shift_off": "راحة نوبة",
    "vacation": "إجازة رسمية",
    "mission": "مأمورية",
}


class ShiftRosterGroupViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": "attendance.view",
        "retrieve": "attendance.view",
        "create": ["attendance.record", "attendance.manage"],
        "update": ["attendance.record", "attendance.manage"],
        "partial_update": ["attendance.record", "attendance.manage"],
        "destroy": ["attendance.record", "attendance.manage"],
    }
    queryset = ShiftRosterGroup.objects.select_related("faction").prefetch_related("members").all()
    serializer_class = ShiftRosterGroupSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        faction_id = self.request.query_params.get("faction")
        if faction_id:
            qs = qs.filter(faction_id=faction_id)
        return qs


class DailyAttendanceViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    queryset = DailyAttendance.objects.select_related("member", "member__faction", "member__rank").all()
    serializer_class = DailyAttendanceSerializer
    permission_map = {
        "list": "attendance.view",
        "retrieve": "attendance.view",
        "create": ["attendance.record", "attendance.manage"],
        "update": ["attendance.record", "attendance.manage"],
        "partial_update": ["attendance.record", "attendance.manage"],
        "destroy": ["attendance.record", "attendance.manage"],
        "daily_sheet": "attendance.view",
        "monthly_matrix": "attendance.view",
        "record_bulk": ["attendance.record", "attendance.manage"],
    }
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["date", "member", "status"]
    ordering_fields = ["date", "created_at"]

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(date=date_param)
        faction_param = self.request.query_params.get("faction")
        if faction_param and str(faction_param).lower() not in ("all", "none", "", "null", "undefined"):
            try:
                qs = qs.filter(member__faction_id=int(faction_param))
            except (ValueError, TypeError):
                pass
        status_param = self.request.query_params.get("status")
        if status_param and str(status_param).lower() not in ("all", "none", "", "null", "undefined"):
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        data = serializer.validated_data
        rec = ShiftRotationService.record_attendance(
            member=data["member"],
            target_date=data["date"],
            status=data["status"],
            check_in_time=data.get("check_in_time"),
            check_out_time=data.get("check_out_time"),
            late_hours=data.get("late_hours", Decimal("0.0")),
            early_departure_hours=data.get("early_departure_hours", Decimal("0.0")),
            excused_hours=data.get("excused_hours", Decimal("0.0")),
            notes=data.get("notes", ""),
            recorded_by=self.request.user,
        )
        serializer.instance = rec

    def perform_update(self, serializer):
        data = serializer.validated_data
        instance = self.get_object()
        member = data.get("member", instance.member)
        target_date = data.get("date", instance.date)
        status = data.get("status", instance.status)
        rec = ShiftRotationService.record_attendance(
            member=member,
            target_date=target_date,
            status=status,
            check_in_time=data.get("check_in_time", instance.check_in_time),
            check_out_time=data.get("check_out_time", instance.check_out_time),
            late_hours=data.get("late_hours", instance.late_hours),
            early_departure_hours=data.get("early_departure_hours", instance.early_departure_hours),
            excused_hours=data.get("excused_hours", instance.excused_hours),
            notes=data.get("notes", instance.notes),
            recorded_by=self.request.user,
        )
        serializer.instance = rec

    @action(detail=False, methods=["get"], url_path="daily-sheet")
    def daily_sheet(self, request):
        """Returns single-day roll call view with rotation shift schedules."""
        target_date_str = request.query_params.get("date")
        if target_date_str:
            try:
                target_date = datetime.strptime(target_date_str, "%Y-%m-%d").date()
            except ValueError:
                return Response(
                    {"error": "صيغة التاريخ غير صالحة، يجب أن تكون YYYY-MM-DD"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            target_date = date.today()

        faction_id = request.query_params.get("faction")
        if faction_id and str(faction_id).lower() in ("all", "none", "", "null", "undefined"):
            faction_id = None

        sheet_data = ShiftRotationService.get_daily_sheet(
            faction_id=faction_id, target_date=target_date, user=request.user
        )
        return Response(sheet_data)

    @action(detail=False, methods=["get"], url_path="monthly-matrix")
    def monthly_matrix(self, request):
        """Returns the monthly matrix for all days in the requested month."""
        year = request.query_params.get("year")
        month = request.query_params.get("month")
        faction_id = request.query_params.get("faction")
        if faction_id and str(faction_id).lower() in ("all", "none", "", "null", "undefined"):
            faction_id = None

        matrix_data = ShiftRotationService.get_monthly_matrix(
            faction_id=faction_id, year=year, month=month, user=request.user
        )
        return Response(matrix_data)

    @action(detail=False, methods=["post"], url_path="record-bulk")
    def record_bulk(self, request):
        """Saves a batch of attendance records and automatically handles vacation deductions for excused hours."""
        serializer = BulkAttendanceRecordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_date = serializer.validated_data["date"]
        records_data = serializer.validated_data["records"]

        saved_count = 0
        deducted_count = 0
        recorded_members = []

        for item in records_data:
            member = Member.objects.filter(id=item["member_id"], is_deleted=False).first()
            if not member:
                continue

            rec = ShiftRotationService.record_attendance(
                member=member,
                target_date=target_date,
                status=item["status"],
                check_in_time=item.get("check_in_time"),
                check_out_time=item.get("check_out_time"),
                late_hours=item.get("late_hours", 0.0),
                early_departure_hours=item.get("early_departure_hours", 0.0),
                excused_hours=item.get("excused_hours", 0.0),
                notes=item.get("notes", ""),
                recorded_by=request.user,
            )
            saved_count += 1
            if rec.deducted_vacation_days > 0:
                deducted_count += 1

            st_text = STATUS_AR_LABELS.get(rec.status, rec.status)
            if rec.late_hours > 0:
                st_text += f" (تأخير {rec.late_hours}س)"
            if rec.excused_hours > 0:
                st_text += f" (إذن {rec.excused_hours}س)"
            recorded_members.append({"id": member.id, "name": member.full_name, "status_text": st_text})

        # Accurate Granular Audit Logging
        if saved_count == 1 and recorded_members:
            m_info = recorded_members[0]
            log_activity(
                actor=request.user,
                action="attendance_update_member",
                target_model="DailyAttendance",
                target_id=m_info["id"],
                description=f"تعديل وتحديث تمام الفرد: {m_info['name']} ({m_info['status_text']}) لتاريخ {target_date}",
                metadata={
                    "target_name": m_info["name"],
                    "date": str(target_date),
                    "status": records_data[0].get("status"),
                    "late_hours": float(records_data[0].get("late_hours", 0.0)),
                    "excused_hours": float(records_data[0].get("excused_hours", 0.0)),
                },
                request=request,
            )
        elif 1 < saved_count < 10 and len(records_data) < Member.objects.filter(is_deleted=False).count():
            names_summary = "، ".join([f"{m['name']} ({m['status_text']})" for m in recorded_members[:3]])
            if len(recorded_members) > 3:
                names_summary += f" وآخرين ({len(recorded_members)})"
            log_activity(
                actor=request.user,
                action="attendance_update_subset",
                target_model="DailyAttendance",
                target_id=0,
                description=f"تعديل جزئي لتمام ({saved_count}) أفراد لتاريخ {target_date}: {names_summary}",
                metadata={
                    "date": str(target_date),
                    "total_recorded": saved_count,
                    "vacation_deductions": deducted_count,
                    "members": [m["name"] for m in recorded_members],
                },
                request=request,
            )
        else:
            log_activity(
                actor=request.user,
                action="attendance_record_bulk",
                target_model="DailyAttendance",
                target_id=0,
                description=f"اعتماد وتسجيل كشف التمام لتاريخ {target_date} لكامل القوة ({saved_count} فرد)",
                metadata={
                    "date": str(target_date),
                    "total_recorded": saved_count,
                    "vacation_deductions": deducted_count,
                },
                request=request,
            )

        return Response(
            {
                "status": "success",
                "message": f"تم حفظ تمام ({saved_count}) فرد بنجاح.",
                "recorded_count": saved_count,
                "deductions_count": deducted_count,
            },
            status=status.HTTP_200_OK,
        )
