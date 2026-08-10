from django.urls import path

from apps.reports.views import MemberExportView, MemberIdCardsView, MemberPrintView, ReportSectionsView

urlpatterns = [
    path("reports/sections/", ReportSectionsView.as_view(), name="report-sections"),
    path("members/<int:pk>/print/", MemberPrintView.as_view(), name="member-print"),
    path("members/id-cards/", MemberIdCardsView.as_view(), name="member-id-cards"),
    path("members/export/", MemberExportView.as_view(), name="member-export"),
]
