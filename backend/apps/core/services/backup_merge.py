import json
from django.db import transaction
from django.apps import apps

from apps.core.models import ActivityLog, BackupRecord, Role, User
from apps.members.models import (
    FieldRequirement,
    Member,
    MemberDocument,
    MemberEvaluation,
    MemberNote,
    MemberPledge,
    MemberTask,
    VacationRequest,
    VacationTransaction,
)
from apps.organization.models import DocumentType, Faction, Rank


def merge_json_backup(json_str_or_bytes):
    """Parses a JSON dump (or decrypted backup bytes) and merges data into the
    live database without destroying existing records.
    Returns a dictionary of statistics summarizing created and updated rows.
    """
    if isinstance(json_str_or_bytes, bytes):
        json_str = json_str_or_bytes.decode("utf-8")
    else:
        json_str = json_str_or_bytes

    items = json.loads(json_str)
    if not isinstance(items, list):
        raise ValueError("Invalid backup format: expected a JSON array of model instances.")

    stats = {
        "ranks": 0,
        "factions": 0,
        "document_types": 0,
        "members": 0,
        "documents": 0,
        "pledges": 0,
        "vacation_requests": 0,
        "vacation_transactions": 0,
        "notes": 0,
        "tasks": 0,
        "evaluations": 0,
    }

    with transaction.atomic():
        # 1. Merge Ranks & Factions
        for item in items:
            model_name = item.get("model")
            pk = item.get("pk")
            fields = item.get("fields", {})

            if model_name == "organization.rank":
                code = fields.get("code") or f"rank-{pk}"
                obj, created = Rank.objects.update_or_create(
                    code=code,
                    defaults={
                        "name_ar": fields.get("name_ar", ""),
                        "order": fields.get("order", 0),
                        "is_active": fields.get("is_active", True),
                    },
                )
                if created: stats["ranks"] += 1

            elif model_name == "organization.faction":
                code = fields.get("code") or f"faction-{pk}"
                obj, created = Faction.objects.update_or_create(
                    code=code,
                    defaults={
                        "name_ar": fields.get("name_ar", ""),
                        "is_active": fields.get("is_active", True),
                    },
                )
                if created: stats["factions"] += 1

            elif model_name == "organization.documenttype":
                code = fields.get("code") or f"doc-type-{pk}"
                obj, created = DocumentType.objects.update_or_create(
                    code=code,
                    defaults={
                        "name_ar": fields.get("name_ar", ""),
                        "requires_expiry": fields.get("requires_expiry", False),
                        "allow_multiple": fields.get("allow_multiple", True),
                        "is_printable": fields.get("is_printable", True),
                        "print_order": fields.get("print_order", 0),
                        "is_system": fields.get("is_system", False),
                    },
                )
                if created: stats["document_types"] += 1

        # 2. Merge Members by national_number or force_number
        rank_map = {r.id: r for r in Rank.objects.all()}
        faction_map = {f.id: f for f in Faction.objects.all()}
        doc_type_map = {dt.id: dt for dt in DocumentType.objects.all()}

        member_pk_map = {}  # old_pk -> new_member_instance

        for item in items:
            model_name = item.get("model")
            pk = item.get("pk")
            fields = item.get("fields", {})

            if model_name == "members.member":
                nat_num = fields.get("national_number")
                force_num = fields.get("force_number")
                if not nat_num and not force_num:
                    continue

                rank_id = fields.get("rank")
                faction_id = fields.get("faction")

                rank_obj = rank_map.get(rank_id) or Rank.objects.first()
                faction_obj = faction_map.get(faction_id) or Faction.objects.first()

                if not rank_obj or not faction_obj:
                    continue

                defaults = {
                    "first_name": fields.get("first_name", ""),
                    "second_name": fields.get("second_name", ""),
                    "third_name": fields.get("third_name", ""),
                    "last_name": fields.get("last_name", ""),
                    "force_number": force_num,
                    "date_of_birth": fields.get("date_of_birth"),
                    "place_of_birth": fields.get("place_of_birth", ""),
                    "blood_type": fields.get("blood_type", ""),
                    "rank": rank_obj,
                    "faction": faction_obj,
                    "phone": fields.get("phone", ""),
                    "join_date": fields.get("join_date"),
                    "approval_status": fields.get("approval_status", "approved"),
                    "service_status": fields.get("service_status", "active"),
                    "vacation_balance_days": fields.get("vacation_balance_days", "0.0"),
                }

                if nat_num:
                    member_obj, created = Member.objects.update_or_create(
                        national_number=nat_num, defaults=defaults
                    )
                else:
                    member_obj, created = Member.objects.update_or_create(
                        force_number=force_num, defaults=defaults
                    )

                member_pk_map[pk] = member_obj
                if created: stats["members"] += 1

        # 3. Merge Pledges, Documents, Vacations, Notes, Tasks, Evaluations
        for item in items:
            model_name = item.get("model")
            pk = item.get("pk")
            fields = item.get("fields", {})

            member_id = fields.get("member")
            target_member = member_pk_map.get(member_id) or Member.objects.filter(id=member_id).first()

            if not target_member:
                continue

            if model_name == "members.memberpledge":
                title = fields.get("title", "")
                if title:
                    pledge_obj, created = MemberPledge.objects.get_or_create(
                        member=target_member,
                        title=title,
                        issue_date=fields.get("issue_date"),
                        defaults={
                            "description": fields.get("description", ""),
                            "original_name": fields.get("original_name", ""),
                        },
                    )
                    if created: stats["pledges"] += 1

            elif model_name == "members.vacationrequest":
                start_date = fields.get("start_date")
                end_date = fields.get("end_date")
                if start_date and end_date:
                    req_obj, created = VacationRequest.objects.get_or_create(
                        member=target_member,
                        start_date=start_date,
                        end_date=end_date,
                        defaults={
                            "days": fields.get("days", 1),
                            "reason": fields.get("reason", ""),
                            "status": fields.get("status", "approved"),
                        },
                    )
                    if created: stats["vacation_requests"] += 1

            elif model_name == "members.membernote":
                body = fields.get("body", "")
                if body:
                    note_obj, created = MemberNote.objects.get_or_create(
                        member=target_member,
                        body=body,
                        defaults={"is_pinned": fields.get("is_pinned", False)},
                    )
                    if created: stats["notes"] += 1

            elif model_name == "members.membertask":
                title = fields.get("title", "")
                if title:
                    task_obj, created = MemberTask.objects.get_or_create(
                        member=target_member,
                        title=title,
                        defaults={
                            "priority": fields.get("priority", "normal"),
                            "status": fields.get("status", "open"),
                            "due_date": fields.get("due_date"),
                        },
                    )
                    if created: stats["tasks"] += 1

            elif model_name == "members.memberevaluation":
                p_start = fields.get("period_start")
                p_end = fields.get("period_end")
                if p_start and p_end:
                    eval_obj, created = MemberEvaluation.objects.get_or_create(
                        member=target_member,
                        period_start=p_start,
                        period_end=p_end,
                        defaults={
                            "body": fields.get("body", ""),
                            "score": fields.get("score"),
                        },
                    )
                    if created: stats["evaluations"] += 1

    return stats
