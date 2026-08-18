import calendar
from datetime import date, datetime
from decimal import Decimal
from django.db import transaction

from apps.attendance.models import DailyAttendance, ShiftRosterGroup
from apps.members.models import Member
from apps.members.services.vacation import apply_vacation_transaction


class ShiftRotationService:
    """Service implementing dynamic shift calculations and attendance vacation deductions."""

    HOURLY_TO_DAY_RATIO = Decimal("8.0")  # 8 hours = 1 vacation day

    @classmethod
    def get_member_expected_duty(cls, member: Member, target_date: date) -> str:
        """Calculates expected duty for member on target_date based on their assigned shift group."""
        group = member.shift_rosters.filter(is_active=True).first()
        if not group:
            # If no roster assigned, default to weekday admin schedule
            # 4=Friday, 5=Saturday (off in standard calendar)
            return "duty" if target_date.weekday() not in (4, 5) else "off"

        return "duty" if group.is_on_duty_on(target_date) else "off"

    @classmethod
    def get_daily_sheet(cls, faction_id=None, target_date=None):
        """Returns the full roster and attendance state for all members for a specific day."""
        if target_date is None:
            target_date = date.today()
        elif isinstance(target_date, str):
            target_date = datetime.strptime(target_date, "%Y-%m-%d").date()

        members_qs = Member.objects.select_related("rank", "faction").prefetch_related("shift_rosters").filter(is_deleted=False)
        if faction_id:
            members_qs = members_qs.filter(faction_id=faction_id)

        # Prefetch existing attendance records for target_date
        records_map = {
            rec.member_id: rec
            for rec in DailyAttendance.objects.filter(date=target_date, is_deleted=False)
        }

        results = []
        for m in members_qs:
            expected = cls.get_member_expected_duty(m, target_date)
            record = records_map.get(m.id)
            group = m.shift_rosters.filter(is_active=True).first()

            results.append({
                "member_id": m.id,
                "member_name": m.full_name,
                "force_number": m.force_number,
                "rank_name": m.rank.name_ar if m.rank else "",
                "faction_id": m.faction_id,
                "faction_name": m.faction.name_ar if m.faction else "",
                "shift_group_name": group.name_ar if group else "دوام إداري",
                "shift_pattern": group.pattern if group else "daily_admin",
                "expected_duty": expected,  # "duty" or "off"
                "attendance_id": record.id if record else None,
                "status": record.status if record else ("shift_off" if expected == "off" else "present"),
                "is_recorded": record is not None,
                "check_in_time": record.check_in_time.strftime("%H:%M") if record and record.check_in_time else None,
                "check_out_time": record.check_out_time.strftime("%H:%M") if record and record.check_out_time else None,
                "late_hours": float(record.late_hours) if record else 0.0,
                "early_departure_hours": float(record.early_departure_hours) if record else 0.0,
                "excused_hours": float(record.excused_hours) if record else 0.0,
                "deducted_vacation_days": float(record.deducted_vacation_days) if record else 0.0,
                "vacation_balance_days": float(m.vacation_balance_days),
                "notes": record.notes if record else "",
            })

        return {
            "date": target_date.strftime("%Y-%m-%d"),
            "faction_id": faction_id,
            "total_members": len(results),
            "expected_on_duty": sum(1 for r in results if r["expected_duty"] == "duty"),
            "expected_off_duty": sum(1 for r in results if r["expected_duty"] == "off"),
            "recorded_count": sum(1 for r in results if r["is_recorded"]),
            "items": results,
        }

    @classmethod
    def get_monthly_matrix(cls, faction_id=None, year=None, month=None):
        """Returns monthly roll-call grid matrix (1..days_in_month) for all members."""
        today = date.today()
        year = int(year) if year else today.year
        month = int(month) if month else today.month

        num_days = calendar.monthrange(year, month)[1]
        start_date = date(year, month, 1)
        end_date = date(year, month, num_days)

        members_qs = Member.objects.select_related("rank", "faction").prefetch_related("shift_rosters").filter(is_deleted=False)
        if faction_id:
            members_qs = members_qs.filter(faction_id=faction_id)

        # Fetch all attendance records for the month
        records = DailyAttendance.objects.filter(
            date__range=[start_date, end_date],
            is_deleted=False,
        ).select_related("member")

        # Map by (member_id, day_int)
        att_map = {(r.member_id, r.date.day): r for r in records}

        matrix_rows = []
        for m in members_qs:
            group = m.shift_rosters.filter(is_active=True).first()
            days_data = {}
            total_present = 0
            total_late_hours = Decimal("0.0")
            total_early_hours = Decimal("0.0")
            total_excused_hours = Decimal("0.0")
            total_deducted_days = Decimal("0.0")
            total_unexcused = 0
            total_shift_off = 0

            for d in range(1, num_days + 1):
                cur_date = date(year, month, d)
                rec = att_map.get((m.id, d))
                expected = cls.get_member_expected_duty(m, cur_date)

                if rec:
                    st = rec.status
                    l_h = rec.late_hours
                    e_h = rec.early_departure_hours
                    ex_h = rec.excused_hours
                    ded_d = rec.deducted_vacation_days
                else:
                    st = "shift_off" if expected == "off" else "unrecorded"
                    l_h = Decimal("0.0")
                    e_h = Decimal("0.0")
                    ex_h = Decimal("0.0")
                    ded_d = Decimal("0.0")

                if st in ("present", "late", "early_departure"):
                    total_present += 1
                if st == "unexcused_absence":
                    total_unexcused += 1
                if st == "shift_off":
                    total_shift_off += 1

                total_late_hours += l_h
                total_early_hours += e_h
                total_excused_hours += ex_h
                total_deducted_days += ded_d

                days_data[str(d)] = {
                    "status": st,
                    "expected": expected,
                    "late_hours": float(l_h),
                    "early_hours": float(e_h),
                    "excused_hours": float(ex_h),
                    "deducted_days": float(ded_d),
                }

            matrix_rows.append({
                "member_id": m.id,
                "member_name": m.full_name,
                "force_number": m.force_number,
                "rank_name": m.rank.name_ar if m.rank else "",
                "faction_name": m.faction.name_ar if m.faction else "",
                "shift_group_name": group.name_ar if group else "دوام إداري",
                "vacation_balance_days": float(m.vacation_balance_days),
                "summary": {
                    "total_present": total_present,
                    "total_late_hours": float(total_late_hours),
                    "total_early_hours": float(total_early_hours),
                    "total_excused_hours": float(total_excused_hours),
                    "total_deducted_days": float(total_deducted_days),
                    "total_unexcused": total_unexcused,
                    "total_shift_off": total_shift_off,
                },
                "days": days_data,
            })

        return {
            "year": year,
            "month": month,
            "days_in_month": num_days,
            "faction_id": faction_id,
            "rows": matrix_rows,
            "matrix": matrix_rows,
        }

    @classmethod
    @transaction.atomic
    def record_attendance(
        cls,
        member: Member,
        target_date: date,
        status: str,
        check_in_time=None,
        check_out_time=None,
        late_hours=Decimal("0.0"),
        early_departure_hours=Decimal("0.0"),
        excused_hours=Decimal("0.0"),
        notes="",
        recorded_by=None,
    ) -> DailyAttendance:
        """Records daily attendance and calculates vacation deduction if excused absence."""
        expected = cls.get_member_expected_duty(member, target_date)
        late_hours = Decimal(str(late_hours or 0.0))
        early_departure_hours = Decimal(str(early_departure_hours or 0.0))
        excused_hours = Decimal(str(excused_hours or 0.0))

        # Calculate vacation deduction for excused hours
        deducted_days = Decimal("0.0")
        if status == "excused_absence" or excused_hours > 0:
            if excused_hours > 0:
                deducted_days = round(excused_hours / cls.HOURLY_TO_DAY_RATIO, 2)
            else:
                deducted_days = Decimal("1.0")  # Full day excused absence

        record, _ = DailyAttendance.objects.get_or_create(
            member=member,
            date=target_date,
            defaults={"expected_status": expected, "recorded_by": recorded_by},
        )

        record.status = status
        record.expected_status = expected
        record.check_in_time = check_in_time
        record.check_out_time = check_out_time
        record.late_hours = late_hours
        record.early_departure_hours = early_departure_hours
        record.excused_hours = excused_hours
        record.notes = notes
        record.recorded_by = recorded_by

        # Handle vacation ledger deduction atomically
        if deducted_days > 0:
            record.deducted_vacation_days = deducted_days
            vac_tx = apply_vacation_transaction(
                member_id=member.id,
                days=-deducted_days,
                kind="deduction",
                reason=f"خصم غياب/استئذان بإذن بتاريخ {target_date} ({excused_hours} ساعة)",
                created_by=recorded_by,
            )
            record.vacation_transaction = vac_tx
        else:
            record.deducted_vacation_days = Decimal("0.0")

        record.save()
        return record
