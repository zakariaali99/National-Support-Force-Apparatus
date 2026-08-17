from datetime import date
from rest_framework import status
from rest_framework.decorators import action
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
from apps.members.models import Member


class ShiftRosterGroupViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = ShiftRosterGroup.objects.select_related("faction").prefetch_related("members").all()
    serializer_class = ShiftRosterGroupSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        faction_id = self.request.query_params.get("faction")
        if faction_id:
            qs = qs.filter(faction_id=faction_id)
        return qs


class DailyAttendanceViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = DailyAttendance.objects.select_related("member", "member__faction", "member__rank").all()
    serializer_class = DailyAttendanceSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        date_param = self.request.query_params.get("date")
        if date_param:
            qs = qs.filter(date=date_param)
        faction_param = self.request.query_params.get("faction")
        if faction_param:
            qs = qs.filter(member__faction_id=faction_param)
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    @action(detail=False, methods=["get"], url_path="daily-sheet")
    def daily_sheet(self, request):
        """Returns dynamic roster and attendance state for all members on a specific date."""
        target_date_str = request.query_params.get("date", str(date.today()))
        faction_id = request.query_params.get("faction")
        sheet_data = ShiftRotationService.get_daily_sheet(
            faction_id=faction_id, target_date=target_date_str
        )
        return Response(sheet_data)

    @action(detail=False, methods=["get"], url_path="monthly-matrix")
    def monthly_matrix(self, request):
        """Returns monthly roll-call matrix (1..days_in_month) with totals."""
        year = request.query_params.get("year")
        month = request.query_params.get("month")
        faction_id = request.query_params.get("faction")
        matrix_data = ShiftRotationService.get_monthly_matrix(
            faction_id=faction_id, year=year, month=month
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

        log_activity(
            actor=request.user,
            action="attendance_record_bulk",
            target_model="DailyAttendance",
            target_id=0,
            description=f"تسجيل التمام اليومي لتاريخ {target_date} لعدد ({saved_count}) فرد",
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
