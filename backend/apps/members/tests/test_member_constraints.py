from django.db import IntegrityError, transaction
from django.test import TestCase

from apps.members.models import Member
from apps.organization.models import Faction, Rank


class MemberConstraintTests(TestCase):
    def setUp(self):
        self.rank = Rank.objects.create(code="soldier2", name_ar="جندي")
        self.faction = Faction.objects.create(code="unit-b", name_ar="الوحدة ب")

    def _make(self, **overrides):
        defaults = dict(
            first_name="خالد",
            second_name="سالم",
            last_name="المبروك",
            force_number="5001",
            national_number="223456789012",
            rank=self.rank,
            faction=self.faction,
        )
        defaults.update(overrides)
        return Member.objects.create(**defaults)

    def test_duplicate_force_number_among_active_members_rejected(self):
        self._make()
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                self._make(national_number="223456789013")

    def test_force_number_reusable_after_soft_delete(self):
        member = self._make()
        member.soft_delete()

        # Must not raise — the whole point of the conditional constraint.
        second = self._make(national_number="223456789013")
        self.assertEqual(second.force_number, member.force_number)

    def test_search_name_is_maintained_on_save(self):
        member = self._make(first_name="أحمد")
        self.assertIn("احمد", member.search_name)
