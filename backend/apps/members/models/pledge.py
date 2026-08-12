from django.db import models
from simple_history.models import HistoricalRecords

from apps.core.models.base import BaseModel
from apps.core.storage import PrivateMediaStorage, private_upload_path


class MemberPledge(BaseModel):
    """A pledge/commitment document attached to a member's profile.
    Supports description text and optional PDF or image attachments.
    """

    private_upload_folder = "member-pledges"

    member = models.ForeignKey(
        "members.Member", on_delete=models.CASCADE, related_name="pledges_list"
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    attachment = models.FileField(
        upload_to=private_upload_path,
        storage=PrivateMediaStorage(),
        null=True,
        blank=True,
    )
    original_name = models.CharField(max_length=255, blank=True)
    issue_date = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(
        "core.User", null=True, blank=True, on_delete=models.SET_NULL, related_name="+"
    )

    history = HistoricalRecords(excluded_fields=["updated_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Member Pledge"
        verbose_name_plural = "Member Pledges"

    def __str__(self):
        return f"{self.member} — {self.title}"
