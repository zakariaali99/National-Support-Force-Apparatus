from django.contrib import admin

from apps.transportation.models.vehicle import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "vehicle_type",
        "vin_number",
        "plate_number",
        "faction",
        "assigned_driver",
        "has_weapon",
        "status",
    ]
    list_filter = ["vehicle_type", "status", "has_weapon", "faction"]
    search_fields = ["name", "vin_number", "plate_number", "mounted_weapon_name", "mounted_weapon_serial"]
