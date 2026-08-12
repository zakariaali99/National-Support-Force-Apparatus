import json
from pathlib import Path

from django.core.management import call_command
from django.http import FileResponse, Http404
from django.utils.timezone import now

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.activity import log_activity
from apps.core.backup_crypto import decrypt_bytes
from apps.core.models import BackupRecord
from apps.core.services.backup_merge import merge_json_backup


class BackupListView(APIView):
    """GET /api/backups/ — list backup metadata with humanized timestamps."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        if not request.user.has_permission("backup.run"):
            raise PermissionDenied("لا تملك صلاحية عرض النسخ الاحتياطية.")

        records = BackupRecord.objects.select_related("created_by").all()[:100]
        return Response(
            [
                {
                    "id": r.id,
                    "file_size": r.file_size,
                    "sha256": r.sha256,
                    "encrypted": r.encrypted,
                    "created_by": r.created_by.username if r.created_by else None,
                    "created_at": r.created_at,
                }
                for r in records
            ]
        )


class BackupRunView(APIView):
    """POST /api/backups/run/ — triggers backup_db synchronously."""

    permission_classes = [IsAuthenticated]

    @extend_schema(request=None, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        if not request.user.has_permission("backup.run"):
            raise PermissionDenied("لا تملك صلاحية تشغيل نسخة احتياطية.")

        call_command("backup_db", force=True)
        record = BackupRecord.objects.order_by("-created_at").first()
        if record and not record.created_by_id:
            record.created_by = request.user
            record.save(update_fields=["created_by"])

        log_activity(
            actor=request.user,
            action="backup_run",
            target_model="BackupRecord",
            target_id=record.id if record else "",
            request=request,
        )
        return Response({"id": record.id if record else None, "created_at": record.created_at if record else None})


class BackupDownloadView(APIView):
    """GET /api/backups/<id>/download/ — serves the backup file."""

    permission_classes = [IsAuthenticated]

    @extend_schema(responses={200: OpenApiTypes.BINARY})
    def get(self, request, pk):
        if not request.user.has_permission("backup.download"):
            raise PermissionDenied("لا تملك صلاحية تحميل النسخ الاحتياطية.")
        try:
            record = BackupRecord.objects.get(pk=pk)
        except BackupRecord.DoesNotExist as exc:
            raise Http404 from exc

        path = Path(record.file_path)
        if not path.exists():
            raise Http404

        log_activity(
            actor=request.user,
            action="backup_download",
            target_model="BackupRecord",
            target_id=record.id,
            request=request,
        )

        response = FileResponse(path.open("rb"), content_type="application/octet-stream")
        response["Content-Disposition"] = f'attachment; filename="{path.name}"'
        return response


class BackupRestoreView(APIView):
    """POST /api/backups/<pk>/restore/ or POST /api/backups/restore-upload/
    Restores the database from a backup file.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, pk=None):
        if not request.user.has_permission("backup.run"):
            raise PermissionDenied("لا تملك صلاحية استعادة النسخ الاحتياطية.")

        file_obj = request.FILES.get("file")
        if pk:
            try:
                record = BackupRecord.objects.get(pk=pk)
                path = Path(record.file_path)
                if not path.exists():
                    raise Http404("ملف النسخة الاحتياطية غير موجود بالمجلد.")
                raw_bytes = path.read_bytes()
            except BackupRecord.DoesNotExist as exc:
                raise Http404 from exc
        elif file_obj:
            raw_bytes = file_obj.read()
        else:
            return Response({"error": "يرجى تحديد النسخة أو تقديم ملف للرفع."}, status=400)

        # Decrypt if encrypted bytes
        try:
            dump_data = decrypt_bytes(raw_bytes)
        except Exception:
            dump_data = raw_bytes

        # Perform loaddata or merge restore
        try:
            stats = merge_json_backup(dump_data)
            log_activity(
                actor=request.user,
                action="backup_restore",
                target_model="BackupRecord",
                target_id=pk or "uploaded_file",
                request=request,
            )
            return Response({"status": "success", "message": "تمت استعادة النسخة بنجاح", "stats": stats})
        except Exception as exc:
            return Response({"error": f"تعذرت استعادة النسخة: {str(exc)}"}, status=400)


class BackupMergeView(APIView):
    """POST /api/backups/<pk>/merge/ or POST /api/backups/merge-upload/
    Merges backup data with live database without overwriting existing data.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, pk=None):
        if not request.user.has_permission("backup.run"):
            raise PermissionDenied("لا تملك صلاحية دمج النسخ الاحتياطية.")

        file_obj = request.FILES.get("file")
        if pk:
            try:
                record = BackupRecord.objects.get(pk=pk)
                path = Path(record.file_path)
                if not path.exists():
                    raise Http404("ملف النسخة الاحتياطية غير موجود بالمجلد.")
                raw_bytes = path.read_bytes()
            except BackupRecord.DoesNotExist as exc:
                raise Http404 from exc
        elif file_obj:
            raw_bytes = file_obj.read()
        else:
            return Response({"error": "يرجى تحديد النسخة أو تقديم ملف للدمج."}, status=400)

        # Decrypt if encrypted bytes
        try:
            dump_data = decrypt_bytes(raw_bytes)
        except Exception:
            dump_data = raw_bytes

        try:
            stats = merge_json_backup(dump_data)
            log_activity(
                actor=request.user,
                action="backup_merge",
                target_model="BackupRecord",
                target_id=pk or "uploaded_file",
                request=request,
            )
            return Response({"status": "success", "message": "تم دمج بيانات النسخة بنجاح مع البيانات الحالية", "stats": stats})
        except Exception as exc:
            return Response({"error": f"تعذر دمج البيانات: {str(exc)}"}, status=400)
