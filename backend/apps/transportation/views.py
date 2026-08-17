from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from apps.core.activity import log_activity
from apps.transportation.models.vehicle import Vehicle
from apps.transportation.serializers import VehicleSerializer


class VehicleViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = (
        Vehicle.objects.select_related(
            "faction",
            "assigned_driver",
            "weapon_faction",
            "weapon_assigned_member",
            "mounted_weapon_item",
        )
        .all()
    )
    serializer_class = VehicleSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        type_param = self.request.query_params.get("vehicle_type")
        if type_param:
            qs = qs.filter(vehicle_type=type_param)

        faction_param = self.request.query_params.get("faction")
        if faction_param:
            qs = qs.filter(faction_id=faction_param)

        has_weapon_param = self.request.query_params.get("has_weapon")
        if has_weapon_param is not None:
            if has_weapon_param.lower() in ("true", "1", "yes"):
                qs = qs.filter(has_weapon=True)
            elif has_weapon_param.lower() in ("false", "0", "no"):
                qs = qs.filter(has_weapon=False)

        search_param = self.request.query_params.get("search")
        if search_param:
            qs = qs.filter(
                Q(name__icontains=search_param)
                | Q(vin_number__icontains=search_param)
                | Q(plate_number__icontains=search_param)
                | Q(mounted_weapon_name__icontains=search_param)
                | Q(mounted_weapon_serial__icontains=search_param)
            )

        return qs

    def perform_create(self, serializer):
        vehicle = serializer.save(created_by=self.request.user)
        log_activity(
            actor=self.request.user,
            action="vehicle_create",
            target_model="Vehicle",
            target_id=vehicle.id,
            description=f"إضافة مركبة جديدة إلى قسم النقلية: {vehicle.name} (الهيكل: {vehicle.vin_number})",
            metadata={
                "name": vehicle.name,
                "vin_number": vehicle.vin_number,
                "plate_number": vehicle.plate_number,
                "has_weapon": vehicle.has_weapon,
            },
            request=self.request,
        )

    def perform_update(self, serializer):
        vehicle = serializer.save(updated_by=self.request.user)
        log_activity(
            actor=self.request.user,
            action="vehicle_update",
            target_model="Vehicle",
            target_id=vehicle.id,
            description=f"تعديل بيانات مركبة: {vehicle.name} (الهيكل: {vehicle.vin_number})",
            metadata={
                "name": vehicle.name,
                "status": vehicle.status,
                "has_weapon": vehicle.has_weapon,
            },
            request=self.request,
        )

    def perform_destroy(self, instance):
        log_activity(
            actor=self.request.user,
            action="vehicle_delete",
            target_model="Vehicle",
            target_id=instance.id,
            description=f"حذف مركبة: {instance.name} (الهيكل: {instance.vin_number})",
            request=self.request,
        )
        instance.soft_delete()
