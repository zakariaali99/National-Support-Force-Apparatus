"""openpyxl write-only export — write-only mode streams rows into the
workbook without keeping a full in-memory cell grid, which matters once a
faction list runs into the thousands of members this system is meant to
hold. MAX_EXPORT_ROWS is a hard cap (not a UI page size) so a runaway
filter (or none at all) can't produce an unbounded file; the frontend and
this module both surface the truncation rather than silently dropping
rows.
"""

import io

from openpyxl import Workbook

MAX_EXPORT_ROWS = 5000

COLUMNS = [
    ("full_name", "الاسم الكامل"),
    ("force_number", "الرقم الحربي"),
    ("national_number", "الرقم الوطني"),
    ("rank_name", "الرتبة"),
    ("faction_name", "الفصيل"),
    ("phone", "رقم الهاتف"),
    ("service_status_label", "حالة الخدمة"),
    ("approval_status_label", "حالة الاعتماد"),
    ("join_date", "تاريخ الالتحاق"),
]


def members_to_xlsx(queryset):
    """Returns (bytes, truncated: bool). queryset must be pre-filtered
    (faction scope, search filters, etc.) by the caller.
    """
    wb = Workbook(write_only=True)
    ws = wb.create_sheet("الأعضاء")
    ws.append([label for _, label in COLUMNS])

    truncated = False
    count = 0
    for member in queryset.select_related("rank", "faction").iterator():
        if count >= MAX_EXPORT_ROWS:
            truncated = True
            break
        ws.append(
            [
                member.full_name,
                member.force_number,
                member.national_number,
                member.rank.name_ar if member.rank_id else "",
                member.faction.name_ar if member.faction_id else "",
                member.phone,
                member.get_service_status_display(),
                member.get_approval_status_display(),
                member.join_date.isoformat() if member.join_date else "",
            ]
        )
        count += 1

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue(), truncated
