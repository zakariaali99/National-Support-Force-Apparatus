from django.urls import path

from apps.reports.views import (
    MemberExportView,
    MemberIdCardsView,
    MemberPrintView,
    ReportSectionsView,
    CustodyVoucherPdfView,
    VehicleTripTicketPdfView,
    DailyAttendancePdfView,
    MonthlyAttendancePdfView,
    InventorySummaryPdfView,
)

urlpatterns = [
    path("reports/sections/", ReportSectionsView.as_view(), name="report-sections"),
    path("members/<int:pk>/print/", MemberPrintView.as_view(), name="member-print"),
    path("reports/members/<int:pk>/print/", MemberPrintView.as_view(), name="reports-member-print"),
    path("members/id-cards/", MemberIdCardsView.as_view(), name="member-id-cards"),
    path("members/export/", MemberExportView.as_view(), name="member-export"),
    path("reports/inventory/custody-voucher/", CustodyVoucherPdfView.as_view(), name="custody-voucher-pdf"),
    path("reports/transportation/vehicle/<int:pk>/trip-ticket/", VehicleTripTicketPdfView.as_view(), name="vehicle-trip-ticket-pdf"),
    path("reports/attendance/daily/pdf/", DailyAttendancePdfView.as_view(), name="daily-attendance-pdf"),
    path("reports/attendance/monthly/pdf/", MonthlyAttendancePdfView.as_view(), name="monthly-attendance-pdf"),
    path("reports/inventory/summary/pdf/", InventorySummaryPdfView.as_view(), name="inventory-summary-pdf"),
]
