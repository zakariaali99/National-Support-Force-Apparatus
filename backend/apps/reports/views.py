from datetime import datetime, date
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


def _get_photo_data_uri(member):
    """Safely convert member photo or photo thumbnail into a base64 Data URI
    compatible with WeasyPrint offline PDF compilation. Checks both photo_thumb
    and photo, ensuring file existence on storage before reading.
    """
    import base64
    import logging
    import mimetypes

    logger = logging.getLogger(__name__)

    for file_field in (member.photo_thumb, member.photo):
        if not file_field or not file_field.name:
            continue
        try:
            if not file_field.storage.exists(file_field.name):
                continue
            with file_field.storage.open(file_field.name, "rb") as f:
                content = f.read()
                if not content:
                    continue
                mime_type, _ = mimetypes.guess_type(file_field.name)
                mime_type = mime_type or "image/jpeg"
                encoded = base64.b64encode(content).decode("utf-8")
                return f"data:{mime_type};base64,{encoded}"
        except Exception as exc:
            logger.warning("Failed reading photo %s for member %s: %s", file_field.name, member.pk, exc)
            continue

    return None


def get_html_print_response(html_content, title="تقرير رسمي", orientation="portrait"):
    """Wraps HTML content with Google Fonts, modern screen toolbar, and auto-print trigger for browser compatibility."""
    import re
    is_landscape = orientation == "landscape"
    
    toolbar_html = f"""
    <div class="screen-toolbar no-print">
        <div class="title">
            <span>📄</span>
            <span>{title}</span>
        </div>
        <div class="btn-group">
            <button class="btn btn-primary" onclick="window.print()">
                <span>🖨️ طباعة المستند الآن</span>
            </button>
            <button class="btn btn-outline" onclick="window.close()">
                <span>إغلاق النافذة</span>
            </button>
        </div>
    </div>
    """
    
    inject_script = """
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        };
    </script>
    """
    
    toolbar_styles = """
    <style>
        .screen-toolbar {
            position: sticky;
            top: 0;
            z-index: 100;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: 'Cairo', sans-serif;
            margin-bottom: 12px;
        }
        .screen-toolbar .title {
            font-weight: 700;
            font-size: 13.5px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .screen-toolbar .btn-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .btn {
            font-family: inherit;
            font-size: 12px;
            font-weight: 700;
            padding: 7px 14px;
            border-radius: 6px;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
        }
        .btn-primary {
            background: #2563eb;
            color: #ffffff;
        }
        .btn-primary:hover {
            background: #1d4ed8;
        }
        .btn-outline {
            background: rgba(255,255,255,0.1);
            color: #ffffff;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .btn-outline:hover {
            background: rgba(255,255,255,0.2);
        }
        @media print {
            .screen-toolbar, .no-print {
                display: none !important;
            }
        }
    </style>
    """
    
    # Replace relative static paths to absolute relative to root so browser loads them correctly
    html_content = html_content.replace('src="static/', 'src="/static/')
    html_content = html_content.replace("src='static/", "src='/static/")
    
    if "<head>" in html_content or "<head " in html_content:
        html_content = re.sub(r"(<head[^>]*>)", r"\1" + toolbar_styles, html_content, count=1, flags=re.IGNORECASE)
    
    if "<body" in html_content:
        html_content = re.sub(r"(<body[^>]*>)", r"\1\n" + toolbar_html, html_content, count=1, flags=re.IGNORECASE)
        html_content = html_content.replace("</body>", inject_script + "\n</body>")
    else:
        html_content = f"""<!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="utf-8">
            <title>{title}</title>
            {toolbar_styles}
        </head>
        <body>
            {toolbar_html}
            {html_content}
            {inject_script}
        </body>
        </html>"""
        
    return HttpResponse(html_content, content_type="text/html; charset=utf-8")


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
        summary="طباعة ملف العضو كملف PDF",
        parameters=[
            OpenApiParameter("sections", OpenApiTypes.STR, description="قائمة القطاعات المفصولة بفواصل"),
            OpenApiParameter("documents", OpenApiTypes.STR, description="قائمة المستندات المفصولة بفواصل"),
            OpenApiParameter("preview", OpenApiTypes.STR, description="1 لمعاينة HTML"),
            OpenApiParameter("html", OpenApiTypes.STR, description="1 للطباعة عبر المتصفح كـ HTML"),
        ],
        responses={200: OpenApiTypes.BINARY},
    )
    def get(self, request, pk):
        import re
        try:
            member = Member.objects.select_related("rank", "faction").get(pk=pk)
        except Member.DoesNotExist as exc:
            raise Http404 from exc

        if not request.user.has_permission("member.print"):
            raise PermissionDenied("لا تملك صلاحية طباعة ملفات الأعضاء.")
        if not user_can_access_faction(request.user, member.faction_id):
            raise PermissionDenied("لا تملك صلاحية الوصول لبيانات هذه الإدارة.")

        section_keys = [s for s in request.query_params.get("sections", "profile").split(",") if s]
        document_ids = [d for d in request.query_params.get("documents", "").split(",") if d]

        unknown = [k for k in section_keys if k not in SECTION_BY_KEY]
        if unknown:
            return HttpResponseBadRequest(f"Unknown section key(s): {', '.join(unknown)}")

        photo_uri = _get_photo_data_uri(member)

        contexts = {
            "profile": {"member": member, "printed_at": timezone.now(), "photo_data_uri": photo_uri},
            "notes": {"member": member, "notes": member.notes.select_related("author").all()},
            "tasks": {"member": member, "tasks": member.tasks.select_related("assigned_to").all()},
            "evaluations": {"member": member, "evaluations": member.evaluations.select_related("evaluator").all()},
            "vacation": {"member": member, "requests": member.vacation_requests.all()},
            "pledges": {
                "member": member,
                "pledges": member.pledges_list.select_related("created_by").all(),
                "pledge_text": member.pledges,
                "printed_at": timezone.now(),
            },
        }

        now_local = timezone.localtime(timezone.now()) if timezone.is_aware(timezone.now()) else timezone.now()
        date_str = now_local.strftime("%Y-%m-%d")
        time_str = now_local.strftime("%H:%M")
        
        footer_html = f"""
        <div class="print-footer">
            <span>تاريخ الطباعة: {date_str}</span>
            <span>توقيت الإصدار: {time_str}</span>
            <span>الجهاز الوطني للقوى المساندة - منظومة الإدارة الإلكترونية</span>
        </div>
        """

        if request.query_params.get("html") == "1" or request.query_params.get("preview") == "1":
            pages_html = ""
            for key in section_keys:
                sec_html = render_to_string(SECTION_BY_KEY[key]["template"], contexts[key])
                # Extract body content if sec_html is a full HTML page
                if "<body" in sec_html:
                    body_match = re.search(r"<body[^>]*>([\s\S]*?)</body>", sec_html, re.IGNORECASE)
                    content = body_match.group(1) if body_match else sec_html
                else:
                    content = sec_html
                
                # Remove any existing footer inside template content so we have our unified one
                content = re.sub(r'<div class=["\']print-footer["\'][\s\S]*?</div>', '', content)
                content = re.sub(r'<p class=["\']muted["\'][\s\S]*?تاريخ تجهيز وتحرير الطباعة[\s\S]*?</p>', '', content)
                
                pages_html += f"""
                <div class="document-page page-break">
                    <div class="doc-content-wrapper">
                        {content}
                    </div>
                    {footer_html}
                </div>
                """
            
            # Scanned documents if any
            if document_ids:
                documents = MemberDocument.objects.filter(id__in=document_ids, member=member)
                by_id = {str(d.id): d for d in documents}
                for doc_id in document_ids:
                    doc = by_id.get(doc_id)
                    if not doc:
                        continue
                    if doc.content_type in ("image/jpeg", "image/png"):
                        doc_url = doc.file.url if hasattr(doc.file, 'url') else f"/media/{doc.file.name}"
                        doc_img_html = f"""
                        <div class="document-page page-break">
                            <div class="doc-content-wrapper">
                                <div class="gov-header-container" style="margin-bottom: 16px;">
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px;">
                                        <div style="text-align: right;">
                                            <h1 style="font-size: 15pt; font-weight: 800; color: #0a2540; margin: 0 0 2px 0;">دولة ليبيا</h1>
                                            <h2 style="font-size: 12.5pt; font-weight: 700; color: #0a2540; margin: 0 0 4px 0;">الجهاز الوطني للقوى المساندة / الوحدة القتالية الرابعة</h2>
                                            <h3 style="font-size: 11pt; font-weight: 700; color: #2563eb; margin: 0;">وثيقة مرفقة: {doc.document_type.name_ar if doc.document_type else 'مستند'}</h3>
                                        </div>
                                        <img src="/static/nasf-seal.jpg" alt="شعار الجهاز" style="height: 58px; width: auto; object-fit: contain;" />
                                    </div>
                                    <div style="border-bottom: 2px solid #0a2540; margin-bottom: 6px;"></div>
                                </div>
                                <div style="text-align: center; margin-top: 20px;">
                                    <img src="{doc_url}" style="max-width: 100%; max-height: 700px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 6px;" alt="{doc.original_name}" />
                                </div>
                            </div>
                            {footer_html}
                        </div>
                        """
                        pages_html += doc_img_html

            return get_html_print_response(pages_html, title=f"ملف الفرد - {member.full_name}", orientation="portrait")

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

        try:
            log_activity(
                actor=request.user,
                action="print",
                target_model="Member",
                target_id=member.id,
                description=f"طباعة ملف: {member.full_name}",
                metadata={"sections": section_keys, "documents": document_ids},
                request=request,
            )
        except Exception:
            pass

        disposition = "attachment" if request.query_params.get("download") else "inline"
        response = HttpResponse(merged, content_type="application/pdf")
        response["Content-Disposition"] = f'{disposition}; filename="{member.force_number}-profile.pdf"'
        return response


class MemberIdCardsView(APIView):
    """GET /api/members/id-cards/?ids=1,2,3 — batch ID cards, one
    85.6x54mm page per member, in the given order.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        parameters=[
            OpenApiParameter("ids", OpenApiTypes.STR, description="Comma-separated member ids"),
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

        cards = [
            {
                "member": by_id[i],
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


class CustodyVoucherPdfView(APIView):
    """Generates official vector PDF for custody handover / return / damage voucher."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.has_permission("equipment.view") or request.user.has_permission("equipment.manage")):
            raise PermissionDenied("لا تملك صلاحية طباعة محاضر العهدة.")

        context = {
            "voucher_number": request.query_params.get("voucher_number", f"VCH-{timezone.now().strftime('%y%m%d%H%M')}"),
            "date": request.query_params.get("date", timezone.now().strftime("%Y-%m-%d")),
            "recipient_name": request.query_params.get("recipient_name", "—"),
            "recipient_rank": request.query_params.get("recipient_rank", "—"),
            "recipient_force_number": request.query_params.get("recipient_force_number", "—"),
            "recipient_faction": request.query_params.get("recipient_faction", "—"),
            "item_name": request.query_params.get("item_name", "—"),
            "item_category": request.query_params.get("item_category", "مهمات عامة"),
            "item_code": request.query_params.get("item_code", "—"),
            "item_serial": request.query_params.get("item_serial", "—"),
            "quantity": request.query_params.get("quantity", "1"),
            "notes": request.query_params.get("notes", "").strip(),
        }

        html = render_to_string("print/custody_voucher.html", context)
        if request.query_params.get("html") == "1":
            return get_html_print_response(html, title=f"محضر عهدة - {context['voucher_number']}")

        pdf_bytes = render_html_to_pdf(html)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{context["voucher_number"]}.pdf"'
        return response


class VehicleTripTicketPdfView(APIView):
    """Generates official vehicle dispatch card & trip ticket vector PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None):
        if not (request.user.has_permission("transportation.view") or request.user.has_permission("transportation.manage")):
            raise PermissionDenied("لا تملك صلاحية طباعة أوامر تحرك المركبات.")

        from apps.transportation.models.vehicle import Vehicle
        vehicle = None
        if pk:
            try:
                vehicle = Vehicle.objects.select_related(
                    "faction", "external_unit", "assigned_driver", "weapon_faction", "weapon_external_unit", "weapon_assigned_member"
                ).get(pk=pk)
            except Vehicle.DoesNotExist:
                raise Http404("المركبة غير موجودة")

        affiliation_text = "الإدارة العامة"
        if vehicle:
            if vehicle.external_unit:
                affiliation_text = f"جهة خارجية: {vehicle.external_unit.name_ar}"
            elif vehicle.faction:
                affiliation_text = f"الجهاز: {vehicle.faction.name_ar}"

        context = {
            "trip_number": request.query_params.get("trip_number", f"TRIP-{timezone.now().strftime('%y%m%d%H%M')}"),
            "date": request.query_params.get("date", timezone.now().strftime("%Y-%m-%d")),
            "vehicle_name": vehicle.name if vehicle else request.query_params.get("vehicle_name", "—"),
            "plate_number": vehicle.plate_number if vehicle else request.query_params.get("plate_number", "—"),
            "chassis_number": vehicle.vin_number if vehicle else request.query_params.get("chassis_number", "—"),
            "faction_name": affiliation_text,
            "driver_name": (vehicle.assigned_driver.full_name if vehicle and vehicle.assigned_driver else request.query_params.get("driver_name", "غير محدد")),
            "weapon_name": (vehicle.mounted_weapon_name if vehicle and vehicle.has_weapon else request.query_params.get("weapon_name", "غير مسلحة")),
            "weapon_serial": (vehicle.mounted_weapon_serial if vehicle and vehicle.has_weapon else request.query_params.get("weapon_serial", "—")),
            "start_odometer": getattr(vehicle, "odometer_reading", None) or request.query_params.get("start_odometer", "0"),
            "return_odometer": request.query_params.get("return_odometer", ""),
            "departure_time": request.query_params.get("departure_time", ""),
            "return_time": request.query_params.get("return_time", ""),
            "destination": request.query_params.get("destination") or getattr(vehicle, "destination", "") or "وفق خط السير المعتمد",
            "purpose": request.query_params.get("purpose") or getattr(vehicle, "purpose", "") or "مهمة إدارية / عملياتية رسمية",
            "notes": request.query_params.get("notes") or getattr(vehicle, "notes", "") or "",
        }

        html = render_to_string("print/trip_ticket.html", context)
        if request.query_params.get("html") == "1":
            return get_html_print_response(html, title=f"أمر تحرك - {context['trip_number']}")

        pdf_bytes = render_html_to_pdf(html)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{context["trip_number"]}.pdf"'
        return response


class DailyAttendancePdfView(APIView):
    """Generates official daily attendance sheet vector PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.has_permission("attendance.view") or request.user.has_permission("attendance.record")):
            raise PermissionDenied("لا تملك صلاحية طباعة كشوفات التمام.")

        now = timezone.now()
        date_param = request.query_params.get("date")
        if not date_param or str(date_param).lower() in ("null", "undefined", ""):
            date_str = now.strftime("%Y-%m-%d")
        else:
            try:
                datetime.strptime(str(date_param), "%Y-%m-%d")
                date_str = str(date_param)
            except (ValueError, TypeError):
                date_str = now.strftime("%Y-%m-%d")
        faction_id = request.query_params.get("faction")

        from apps.attendance.models import DailyAttendance
        from apps.organization.models.faction import Faction

        qs = DailyAttendance.objects.filter(date=date_str).select_related("member", "member__rank", "member__faction")
        if faction_id and str(faction_id).lower() not in ("all", "none", "", "null", "undefined"):
            try:
                qs = qs.filter(member__faction_id=int(faction_id))
            except (ValueError, TypeError):
                pass

        rows = []
        counts = {"present": 0, "late": 0, "excused": 0, "unexcused": 0, "shift_off": 0, "vacation": 0}
        status_to_count_key = {
            "present": "present",
            "late": "late",
            "excused": "excused",
            "excused_absence": "excused",
            "unexcused": "unexcused",
            "unexcused_absence": "unexcused",
            "shift_off": "shift_off",
            "vacation": "vacation",
            "mission": "present",
        }
        status_display_map = {
            "present": "حاضر",
            "late": "متأخر",
            "excused": "مأذون",
            "excused_absence": "مأذون",
            "unexcused": "غياب",
            "unexcused_absence": "غياب",
            "shift_off": "راحة نوبة",
            "vacation": "إجازة",
            "mission": "مأمورية",
        }

        for rec in qs.order_by("member__faction", "member__rank__order", "member__last_name"):
            st = rec.status
            count_key = status_to_count_key.get(st)
            if count_key and count_key in counts:
                counts[count_key] += 1

            rows.append({
                "force_number": rec.member.force_number,
                "rank_name": rec.member.rank.name_ar if rec.member.rank else "",
                "member_name": rec.member.full_name,
                "faction_name": rec.member.faction.name_ar if rec.member.faction else "عام",
                "shift_group_name": getattr(rec.member, "shift_group_name", "—"),
                "status": st,
                "status_display": status_display_map.get(st, st),
                "late_hours": str(rec.late_hours) if rec.late_hours else "",
                "excused_hours": str(rec.excused_hours) if rec.excused_hours else "",
                "notes": rec.notes or "",
            })

        faction_name = ""
        if faction_id and str(faction_id).lower() not in ("all", "none", "", "null", "undefined"):
            try:
                faction_name = Faction.objects.get(pk=int(faction_id)).name_ar
            except (Faction.DoesNotExist, ValueError, TypeError):
                pass

        context = {
            "report_number": f"ATT-{timezone.now().strftime('%y%m%d%H%M')}",
            "date": date_str,
            "faction_name": faction_name or "كافة الفصائل والوحدات",
            "total": len(rows),
            "present": counts["present"],
            "late": counts["late"],
            "excused": counts["excused"],
            "unexcused": counts["unexcused"],
            "shift_off": counts["shift_off"],
            "vacation": counts["vacation"],
            "rows": rows,
        }

        html = render_to_string("print/daily_attendance.html", context)
        if request.query_params.get("html") == "1":
            return get_html_print_response(html, title=f"كشف التمام اليومي - {date_str}", orientation="landscape")

        pdf_bytes = render_html_to_pdf(html)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="attendance-{date_str}.pdf"'
        return response


class InventorySummaryPdfView(APIView):
    """Generates official warehouse stock count vector PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.has_permission("equipment.view") or request.user.has_permission("equipment.manage")):
            raise PermissionDenied("لا تملك صلاحية طباعة تقارير المستودع.")

        from apps.equipment.models import InventoryItem

        items_qs = InventoryItem.objects.select_related("category").order_by("category__name_ar", "name")
        items = []
        for it in items_qs:
            items.append({
                "name": it.name,
                "category_name": it.category.name_ar if it.category else "عام",
                "serial_number": it.serial_number,
                "total_quantity": it.total_quantity,
                "available_quantity": it.available_quantity,
                "assigned_quantity": it.assigned_quantity,
                "damaged_quantity": it.damaged_quantity,
            })

        context = {
            "report_number": f"INV-{timezone.now().strftime('%y%m%d%H%M')}",
            "date": timezone.now().strftime("%Y-%m-%d"),
            "items": items,
        }

        html = render_to_string("print/inventory_summary.html", context)
        if request.query_params.get("html") == "1":
            return get_html_print_response(html, title="تقرير جرد المستودع العام", orientation="landscape")

        pdf_bytes = render_html_to_pdf(html)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'inline; filename="inventory-summary.pdf"'
        return response


class MonthlyAttendancePdfView(APIView):
    """Generates official landscape monthly attendance matrix PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.has_permission("attendance.view") or request.user.has_permission("attendance.record")):
            raise PermissionDenied("لا تملك صلاحية طباعة كشوفات التمام الشهري.")

        import calendar
        from apps.attendance.models import DailyAttendance
        from apps.members.models import Member
        from apps.organization.models.faction import Faction

        now = timezone.now()
        year_val = request.query_params.get("year")
        try:
            year = int(year_val) if year_val and year_val not in ("null", "undefined", "") else now.year
        except (ValueError, TypeError):
            year = now.year

        month_val = request.query_params.get("month")
        try:
            month = int(month_val) if month_val and month_val not in ("null", "undefined", "") else now.month
        except (ValueError, TypeError):
            month = now.month

        faction_id = request.query_params.get("faction")

        _, days_in_month = calendar.monthrange(year, month)
        start_date = f"{year:04d}-{month:02d}-01"
        end_date = f"{year:04d}-{month:02d}-{days_in_month:02d}"

        members_qs = Member.objects.select_related("rank", "faction").filter(service_status="active")
        if faction_id and str(faction_id).lower() not in ("all", "none", "", "null", "undefined"):
            try:
                members_qs = members_qs.filter(faction_id=int(faction_id))
            except (ValueError, TypeError):
                pass

        attendance_qs = DailyAttendance.objects.filter(
            date__range=[start_date, end_date]
        ).select_related("member")

        att_map = {}
        for rec in attendance_qs:
            day_num = rec.date.day
            att_map[(rec.member_id, day_num)] = rec

        month_names_ar = [
            "", "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
            "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
        ]

        rows = []
        for m in members_qs.order_by("faction__name_ar", "rank__order", "last_name", "first_name"):
            days_status = []
            present_c = 0
            late_c = 0
            excused_c = 0
            unexcused_c = 0

            for d in range(1, days_in_month + 1):
                rec = att_map.get((m.id, d))
                if not rec:
                    days_status.append({"code": "—", "cls": "status-o"})
                elif rec.status == "present":
                    present_c += 1
                    days_status.append({"code": "ح", "cls": "status-p"})
                elif rec.status == "late":
                    late_c += 1
                    days_status.append({"code": "ت", "cls": "status-l"})
                elif rec.status == "excused_absence":
                    excused_c += 1
                    days_status.append({"code": "إ", "cls": "status-e"})
                elif rec.status == "unexcused_absence":
                    unexcused_c += 1
                    days_status.append({"code": "غ", "cls": "status-u"})
                elif rec.status == "shift_off":
                    days_status.append({"code": "ر", "cls": "status-o"})
                elif rec.status == "vacation":
                    days_status.append({"code": "ج", "cls": "status-v"})
                elif rec.status == "mission":
                    days_status.append({"code": "م", "cls": "status-e"})
                else:
                    days_status.append({"code": "•", "cls": "status-o"})

            rows.append({
                "member_name": m.full_name,
                "rank_name": m.rank.name_ar if m.rank else "فرد",
                "force_number": m.force_number,
                "faction_name": m.faction.name_ar if m.faction else "عام",
                "days_status": days_status,
                "total_present": present_c,
                "total_late": late_c,
                "total_excused": excused_c,
                "total_unexcused": unexcused_c,
            })

        faction_name = ""
        if faction_id and str(faction_id).lower() not in ("all", "none", "", "null", "undefined"):
            try:
                faction_name = Faction.objects.get(pk=int(faction_id)).name_ar
            except (Faction.DoesNotExist, ValueError, TypeError):
                pass

        context = {
            "month_name": month_names_ar[month] if 1 <= month <= 12 else str(month),
            "year": year,
            "date": timezone.now().strftime("%Y-%m-%d"),
            "faction_name": faction_name or "كافة الفصائل والوحدات",
            "days_range": list(range(1, days_in_month + 1)),
            "col_span": days_in_month + 6,
            "rows": rows,
        }

        html = render_to_string("print/monthly_attendance.html", context)
        if request.query_params.get("html") == "1":
            return get_html_print_response(html, title=f"كشف التمام الشهري - {year}-{month}", orientation="landscape")

        pdf_bytes = render_html_to_pdf(html)

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="monthly-attendance-{year}-{month}.pdf"'
        return response
