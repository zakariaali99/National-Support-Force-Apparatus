from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    USER_TYPE_CHOICES = [
        ("admin", "Admin"),
        ("member", "Member"),
        ("supervisor", "Supervisor"),
    ]

    phone = models.CharField(max_length=20, unique=True, blank=True)
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default="member")
    is_verified = models.BooleanField(default=False)

    REQUIRED_FIELDS = ["user_type"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return self.username