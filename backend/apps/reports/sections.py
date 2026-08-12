"""Registry of print sections for a member profile — drives both the
"select sections" popup (GET /api/reports/sections/) and the print
pipeline's dispatch in apps.reports.renderer. A new section is one entry
here + one template, no migration and no frontend change beyond it
appearing in the checkbox list automatically.

Scanned documents (birth certificate, passport, ...) are NOT listed here —
they're per-member and dynamic (apps.members.models.MemberDocument), so the
frontend fetches those separately and passes their ids via the `documents`
query param; see apps.reports.views.MemberPrintView.
"""

SECTION_REGISTRY = [
    {"key": "profile", "label_ar": "الملف الشخصي", "template": "print/profile.html", "order": 1},
    {"key": "notes", "label_ar": "الملاحظات", "template": "print/notes.html", "order": 2},
    {"key": "tasks", "label_ar": "المهام", "template": "print/tasks.html", "order": 3},
    {"key": "evaluations", "label_ar": "التقييمات", "template": "print/evaluations.html", "order": 4},
    {"key": "vacation", "label_ar": "سجل الإجازات", "template": "print/vacation.html", "order": 5},
    {"key": "pledges", "label_ar": "التعهدات والالتزامات", "template": "print/pledges.html", "order": 6},
]

SECTION_BY_KEY = {s["key"]: s for s in SECTION_REGISTRY}
