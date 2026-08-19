from rest_framework import serializers

from apps.transportation.models.external_unit import ExternalUnit
from apps.transportation.models.vehicle import Vehicle


class ExternalUnitSerializer(serializers.ModelSerializer):
    vehicles_count = serializers.IntegerField(source="vehicles.count", read_only=True)

    class Meta:
        model = ExternalUnit
        fields = [
            "id",
            "name_ar",
            "code",
            "commander_name",
            "phone",
            "notes",
            "is_active",
            "vehicles_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class VehicleSerializer(serializers.ModelSerializer):
    affiliation_type_display = serializers.CharField(
        source="get_affiliation_type_display", read_only=True
    )
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    external_unit_name = serializers.CharField(
        source="external_unit.name_ar", read_only=True
    )
    driver_name = serializers.CharField(
        source="assigned_driver.full_name", read_only=True
    )
    driver_force_number = serializers.CharField(
        source="assigned_driver.force_number", read_only=True
    )
    weapon_affiliation_type_display = serializers.CharField(
        source="get_weapon_affiliation_type_display", read_only=True
    )
    weapon_faction_name = serializers.CharField(
        source="weapon_faction.name_ar", read_only=True
    )
    weapon_external_unit_name = serializers.CharField(
        source="weapon_external_unit.name_ar", read_only=True
    )
    weapon_operator_name = serializers.CharField(
        source="weapon_assigned_member.full_name", read_only=True
    )
    weapon_operator_force_number = serializers.CharField(
        source="weapon_assigned_member.force_number", read_only=True
    )
    vehicle_type_display = serializers.CharField(
        source="get_vehicle_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model = Vehicle
        fields = [
            "id",
            "name",
            "vehicle_type",
            "vehicle_type_display",
            "vin_number",
            "plate_number",
            "model_year",
            "color",
            "status",
            "status_display",
            "affiliation_type",
            "affiliation_type_display",
            "faction",
            "faction_name",
            "external_unit",
            "external_unit_name",
            "assigned_driver",
            "driver_name",
            "driver_force_number",
            "has_weapon",
            "mounted_weapon_name",
            "mounted_weapon_serial",
            "mounted_weapon_item",
            "weapon_affiliation_type",
            "weapon_affiliation_type_display",
            "weapon_faction",
            "weapon_faction_name",
            "weapon_external_unit",
            "weapon_external_unit_name",
            "weapon_assigned_member",
            "weapon_operator_name",
            "weapon_operator_force_number",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        has_weapon = attrs.get(
            "has_weapon", getattr(self.instance, "has_weapon", False)
        )
        if not has_weapon:
            attrs["mounted_weapon_name"] = ""
            attrs["mounted_weapon_serial"] = ""
            attrs["mounted_weapon_item"] = None
            attrs["weapon_faction"] = None
            attrs["weapon_external_unit"] = None
            attrs["weapon_assigned_member"] = None

        # Clean affiliation according to selected type
        affiliation_type = attrs.get(
            "affiliation_type", getattr(self.instance, "affiliation_type", "internal")
        )
        if affiliation_type == "external":
            attrs["faction"] = None
        elif affiliation_type == "internal":
            attrs["external_unit"] = None

        weapon_affiliation_type = attrs.get(
            "weapon_affiliation_type", getattr(self.instance, "weapon_affiliation_type", "internal")
        )
        if weapon_affiliation_type == "external":
            attrs["weapon_faction"] = None
        elif weapon_affiliation_type == "internal":
            attrs["weapon_external_unit"] = None

        return attrs
