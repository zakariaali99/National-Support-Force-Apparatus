"""Regression test for the phone-field unique/blank collision.

`phone = CharField(unique=True, blank=True)` without `null=True` meant a
blank phone was stored as `""`, and `unique=True` treats `""` as a real
value — so only one user could ever be created without a phone on file.
Fixed by adding `null=True` and normalizing "" -> None in User.save().
"""

from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.core.models import User


class UserPhoneUniquenessTests(TestCase):
    def test_multiple_users_can_have_no_phone(self):
        User.objects.create_user(username="no-phone-1", password="x")
        User.objects.create_user(username="no-phone-2", password="x")

        self.assertEqual(User.objects.filter(phone__isnull=True).count(), 2)

    def test_blank_phone_is_normalized_to_null(self):
        user = User.objects.create_user(username="blank-phone", password="x", phone="")

        self.assertIsNone(user.phone)

    def test_duplicate_real_phone_numbers_still_rejected(self):
        User.objects.create_user(username="first", password="x", phone="0910000000")

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                User.objects.create_user(username="second", password="x", phone="0910000000")
