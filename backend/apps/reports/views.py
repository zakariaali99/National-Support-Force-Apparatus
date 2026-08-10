from django.http import HttpResponse, HttpResponseBadRequest, Http404
from django.template.loader import render_to_string
from django.utils import timezone

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.activity import log_activity
from apps.core.permissions.classes import scope_queryset_to_user_factions, user_can_access_faction
from apps.members.models import Member, MemberDocument
from apps.reports.composer import compose, document_to_pdf_bytes
from apps.reports.exports import members_to_xlsx
from apps.reports.idcards import qr_data_uri
from apps.reports.renderer import render_html_to_pdf, render_template_to_pdf
from apps.reports.sections import SECTION_BY_KEY, SECTION_REGISTRY


class ReportSectionsView(APIView):
    """Drives the frontend's print-selection popup — see
    apps.reports.sections.SECTION_REGISTRY for why this needs no DB table.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        return Response(
            [{"key": s["key"], "label_ar": s["label_ar"]} for s in SECTION_REGISTRY]
        )


class MemberPrintView(APIView):
    """GET /api/members/<id>/print/?sections=profile,notes&documents=3,5

    Renders the requested sections (from SECTION_REGISTRY, in the order
    given) plus the requested MemberDocument scans, concatenated into one
    PDF — each item on its own sheet (see apps.reports.composer). Requires
    member.print and the same faction-scope check as the member detail
    endpoint. ?download=1 forces an attachment instead of inline; there is
    no partial "some sections failed" response — a bad key/id is a 400.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter("sections", OpenApiTypes.STR, description="Comma-separated section keys"),
            OpenApiParameter("documents", OpenApiTypes.STR, description="Comma-separated MemberDocument ids"),
            OpenApiParameter("download", OpenApiTypes.INT, description="1 to force attachment download"),
            OpenApiParameter("preview", OpenApiTypes.INT, description="1 for a dev-only single-section HTML preview instead of PDF"),
        ],
        responses={200: OpenApiTypes.BINARY},
    )
    def get(self, request, pk):
        try:
            member = Member.objects.select_related("rank", "faction").get(pk=pk)
        except Member.DoesNotExist as exc:
            raise Http404 from exc

        if not request.user.has_permission("member.print"):
            raise PermissionDenied("لا تملك صلاحية طباعة ملفات الأعضاء.")
        if not user_can_access_faction(request.user, member.faction_id):
            raise PermissionDenied("لا تملك صلاحية الوصول لبيانات هذا الفصيل.")

        section_keys = [s for s in request.query_params.get("sections", "profile").split(",") if s]
        document_ids = [d for d in request.query_params.get("documents", "").split(",") if d]

        unknown = [k for k in section_keys if k not in SECTION_BY_KEY]
        if unknown:
            return HttpResponseBadRequest(f"Unknown section key(s): {', '.join(unknown)}")

        contexts = {
            "profile": {"member": member, "printed_at": timezone.now()},
            "notes": {"member": member, "notes": member.notes.select_related("author").all()},
            "tasks": {"member": member, "tasks": member.tasks.select_related("assigned_to").all()},
            "evaluations": {"member": member, "evaluations": member.evaluations.select_related("evaluator").all()},
            "vacation": {"member": member, "requests": member.vacation_requests.all()},
        }

        if request.query_params.get("preview") == "1":
            # Dev-only preview of a single section's HTML (not the merged
            # PDF, which only exists as bytes) — first requested section.
            key = section_keys[0]
            return HttpResponse(render_to_string(SECTION_BY_KEY[key]["template"], contexts[key]))

        pdf_chunks = []
        for key in section_keys:
            section = SECTION_BY_KEY[key]
            pdf_chunks.append(render_template_to_pdf(section["template"], contexts[key]))

        if document_ids:
            documents = MemberDocument.objects.filter(id__in=document_ids, member=member)
            found_ids = {str(d.id) for d in documents}
            missing = set(document_ids) - found_ids
            if missing:
                return HttpResponseBadRequest(f"Unknown document id(s) for this member: {', '.join(missing)}")
            # Preserve the order the client asked for, not queryset order.
            by_id = {str(d.id): d for d in documents}
            for doc_id in document_ids:
                pdf_chunks.append(document_to_pdf_bytes(by_id[doc_id]))

        merged = compose(pdf_chunks)

        log_activity(
            actor=request.user,
            action="print",
            target_model="Member",
            target_id=member.id,
            description=f"طباعة ملف: {member.full_name}",
            metadata={"sections": section_keys, "documents": document_ids},
            request=request,
        )

        disposition = "attachment" if request.query_params.get("download") else "inline"
        response = HttpResponse(merged, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{member.force_number}-profile.pdf"'
        return response


class MemberIdCardsView(APIView):
    """GET /api/members/id-cards/?ids=1,2,3&qr=1 — batch ID cards, one
    85.6x54mm page per member, in the given order (see PLAN.md: "template
    accepts a list of members, batch N-up on A4 is the inevitable next
    request" — this endpoint is the list-accepting part; N-up layout is
    future work, not needed for the local/VPS target yet).
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter("ids", OpenApiTypes.STR, description="Comma-separated member ids"),
            OpenApiParameter("qr", OpenApiTypes.INT, description="1 to include a QR code of the force number"),
        ],
        responses={200: OpenApiTypes.BINARY},
    )
    def get(self, request):
        if not request.user.has_permission("member.print"):
            raise PermissionDenied("لا تملك صلاحية طباعة بطاقات الأعضاء.")

        ids = [i for i in request.query_params.get("ids", "").split(",") if i]
        if not ids:
            return HttpResponseBadRequest("ids is required")

        qs = scope_queryset_to_user_factions(
            request.user, Member.objects.select_related("rank", "faction").filter(id__in=ids)
        )
        by_id = {str(m.id): m for m in qs}
        missing = set(ids) - set(by_id)
        if missing:
            return HttpResponseBadRequest(f"Unknown or inaccessible member id(s): {', '.join(missing)}")

        include_qr = request.query_params.get("qr") == "1"
        cards = [
            {
                "member": by_id[i],
                "qr": qr_data_uri(by_id[i].force_number) if include_qr else None,
            }
            for i in ids
        ]

        pdf_bytes = render_html_to_pdf(render_to_string("print/id_card.html", {"cards": cards}))

        log_activity(
            actor=request.user,
            action="print",
            target_model="Member",
            description="طباعة بطاقات هوية",
            metadata={"member_ids": ids},
            request=request,
        )

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="id-cards.pdf"'
        return response


class MemberExportView(APIView):
    """GET /api/members/export/?faction=&rank=&service_status=&approval_status=
    — Excel export of the (faction-scoped, then query-filtered) member
    list. See apps.reports.exports for the row cap / write-only rationale.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request):
        if not request.user.has_permission("member.export"):
            raise PermissionDenied("لا تملك صلاحية تصدير بيانات الأعضاء.")

        qs = scope_queryset_to_user_factions(request.user, Member.objects.all())
        for param in ("faction", "rank", "service_status", "approval_status"):
            value = request.query_params.get(param)
            if value:
                qs = qs.filter(**{param: value})

        content, truncated = members_to_xlsx(qs.order_by("last_name", "first_name"))

        log_activity(
            actor=request.user,
            action="export",
            target_model="Member",
            description="تصدير قائمة الأعضاء إلى Excel",
            metadata={"filters": dict(request.query_params), "truncated": truncated},
            request=request,
        )

        response = HttpResponse(
            content, content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = 'attachment; filename="members.xlsx"'
        if truncated:
            response["X-Export-Truncated"] = "1"
        return response
