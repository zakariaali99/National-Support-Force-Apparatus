from rest_framework import serializers

from apps.transportation.models.vehicle import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    faction_name = serializers.CharField(source="faction.name_ar", read_only=True)
    driver_name = serializers.CharField(
        source="assigned_driver.full_name", read_only=True
    )
    driver_force_number = serializers.CharField(
        source="assigned_driver.force_number", read_only=True
    )
    weapon_faction_name = serializers.CharField(
        source="weapon_faction.name_ar", read_only=True
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
            "faction",
            "faction_name",
            "assigned_driver",
            "driver_name",
            "driver_force_number",
            "has_weapon",
            "mounted_weapon_name",
            "mounted_weapon_serial",
            "mounted_weapon_item",
            "weapon_faction",
            "weapon_faction_name",
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
            attrs["weapon_assigned_member"] = None
        return attrs
