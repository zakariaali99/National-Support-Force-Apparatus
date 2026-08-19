from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from apps.core.activity import log_activity
from apps.core.permissions.classes import HasPermission
from apps.members.models import Member
from apps.transportation.models.external_unit import ExternalUnit
from apps.transportation.models.vehicle import Vehicle, VehicleCustodyRecord
from apps.transportation.serializers import (
    ExternalUnitSerializer,
    VehicleCustodyRecordSerializer,
    VehicleSerializer,
)


class ExternalUnitViewSet(ModelViewSet):
    """Management of outside units and entities for vehicle and asset affiliations."""

    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["transportation.view", "transportation.manage", "settings.manage"],
        "retrieve": ["transportation.view", "transportation.manage", "settings.manage"],
        "create": ["transportation.manage", "settings.manage"],
        "update": ["transportation.manage", "settings.manage"],
        "partial_update": ["transportation.manage", "settings.manage"],
        "destroy": ["transportation.manage", "settings.manage"],
    }
    queryset = ExternalUnit.objects.all()
    serializer_class = ExternalUnitSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        active_param = self.request.query_params.get("is_active")
        if active_param is not None:
            if active_param.lower() in ("true", "1", "yes"):
                qs = qs.filter(is_active=True)
            elif active_param.lower() in ("false", "0", "no"):
                qs = qs.filter(is_active=False)

        search_param = self.request.query_params.get("search")
        if search_param:
            qs = qs.filter(
                Q(name_ar__icontains=search_param)
                | Q(code__icontains=search_param)
                | Q(commander_name__icontains=search_param)
                | Q(phone__icontains=search_param)
                | Q(notes__icontains=search_param)
            )
        return qs

    def perform_create(self, serializer):
        unit = serializer.save()
        log_activity(
            actor=self.request.user,
            action="external_unit_create",
            target_model="ExternalUnit",
            target_id=unit.id,
            description=f"إضافة وحدة/جهة خارجية جديدة: {unit.name_ar}",
            metadata={"name": unit.name_ar, "code": unit.code},
            request=self.request,
        )

    def perform_update(self, serializer):
        unit = serializer.save()
        log_activity(
            actor=self.request.user,
            action="external_unit_update",
            target_model="ExternalUnit",
            target_id=unit.id,
            description=f"تعديل بيانات الوحدة/الجهة الخارجية: {unit.name_ar}",
            metadata={"name": unit.name_ar, "is_active": unit.is_active},
            request=self.request,
        )

    def perform_destroy(self, instance):
        log_activity(
            actor=self.request.user,
            action="external_unit_delete",
            target_model="ExternalUnit",
            target_id=instance.id,
            description=f"حذف سجل الوحدة/الجهة الخارجية: {instance.name_ar}",
            request=self.request,
        )
        instance.soft_delete()


class VehicleViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["transportation.view", "transportation.manage"],
        "retrieve": ["transportation.view", "transportation.manage"],
        "create": ["transportation.manage"],
        "update": ["transportation.manage"],
        "partial_update": ["transportation.manage"],
        "destroy": ["transportation.manage"],
    }
    queryset = (
        Vehicle.objects.select_related(
            "faction",
            "external_unit",
            "assigned_driver",
            "weapon_faction",
            "weapon_external_unit",
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

        affiliation_param = self.request.query_params.get("affiliation_type")
        if affiliation_param:
            qs = qs.filter(affiliation_type=affiliation_param)

        external_unit_param = self.request.query_params.get("external_unit")
        if external_unit_param:
            qs = qs.filter(external_unit_id=external_unit_param)

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
                | Q(external_unit__name_ar__icontains=search_param)
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
                "affiliation_type": vehicle.affiliation_type,
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
                "affiliation_type": vehicle.affiliation_type,
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

    @action(detail=True, methods=["post"], url_path="return-vehicle")
    def return_vehicle(self, request, pk=None):
        """Return / check-in vehicle to pool, recording return details and who returned it."""
        vehicle = self.get_object()
        driver_id = request.data.get("driver_id")
        notes = request.data.get("notes", "")
        odometer = request.data.get("odometer")
        vehicle_status = request.data.get("status", "ready")

        driver = None
        if driver_id:
            driver = Member.objects.filter(id=driver_id).first()
        elif vehicle.assigned_driver:
            driver = vehicle.assigned_driver

        driver_name = getattr(driver, "full_name", "") or "غير محدد"

        VehicleCustodyRecord.objects.create(
            vehicle=vehicle,
            driver=driver,
            external_unit=vehicle.external_unit,
            faction=vehicle.faction,
            action="returned",
            odometer=int(odometer) if odometer else None,
            notes=notes or "إرجاع واستلام الآلية إلى مرآب النقلية",
            issued_by=request.user,
        )

        # Clear assigned driver upon return to pool
        vehicle.assigned_driver = None
        vehicle.status = vehicle_status
        vehicle.save(update_fields=["assigned_driver", "status"])

        log_activity(
            actor=request.user,
            action="vehicle_custody_return",
            target_model="Vehicle",
            target_id=vehicle.id,
            description=f"إرجاع واستلام الآلية ({vehicle.name}) من ({driver_name})",
            metadata={
                "vehicle_name": vehicle.name,
                "vin_number": vehicle.vin_number,
                "plate_number": vehicle.plate_number,
                "returned_by": driver_name,
                "odometer": odometer,
                "status": vehicle.status,
            },
            request=request,
        )

        return Response(VehicleSerializer(vehicle).data)

    @action(detail=True, methods=["post"], url_path="assign-driver")
    def assign_driver(self, request, pk=None):
        """Assign vehicle to a driver / custodian."""
        vehicle = self.get_object()
        driver_id = request.data.get("driver_id")
        notes = request.data.get("notes", "")
        odometer = request.data.get("odometer")

        if not driver_id:
            return Response(
                {"detail": "يجب تحديد السائق / المسؤول عن الآلية."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        driver = Member.objects.filter(id=driver_id).first()
        if not driver:
            return Response(
                {"detail": "السائق المحدد غير موجود."},
                status=status.HTTP_404_NOT_FOUND,
            )

        vehicle.assigned_driver = driver
        vehicle.status = "ready"
        vehicle.save(update_fields=["assigned_driver", "status"])

        VehicleCustodyRecord.objects.create(
            vehicle=vehicle,
            driver=driver,
            external_unit=vehicle.external_unit,
            faction=vehicle.faction or getattr(driver, "faction", None),
            action="assigned",
            odometer=int(odometer) if odometer else None,
            notes=notes or "تسليم عهدة الآلية للسائق",
            issued_by=request.user,
        )

        log_activity(
            actor=request.user,
            action="vehicle_custody_assign",
            target_model="Vehicle",
            target_id=vehicle.id,
            description=f"تسليم عهدة الآلية ({vehicle.name}) للسائق ({driver.full_name})",
            metadata={
                "vehicle_name": vehicle.name,
                "vin_number": vehicle.vin_number,
                "plate_number": vehicle.plate_number,
                "driver": driver.full_name,
                "driver_force_number": driver.force_number,
            },
            request=request,
        )

        return Response(VehicleSerializer(vehicle).data)


class VehicleCustodyRecordViewSet(ModelViewSet):
    """List and manage vehicle possession and custody history records."""

    permission_classes = [IsAuthenticated, HasPermission]
    permission_map = {
        "list": ["transportation.view", "transportation.manage"],
        "retrieve": ["transportation.view", "transportation.manage"],
        "create": ["transportation.manage"],
        "update": ["transportation.manage"],
        "partial_update": ["transportation.manage"],
        "destroy": ["transportation.manage"],
    }
    queryset = VehicleCustodyRecord.objects.select_related(
        "vehicle", "driver", "external_unit", "faction", "issued_by"
    ).all()
    serializer_class = VehicleCustodyRecordSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        vehicle_param = self.request.query_params.get("vehicle")
        if vehicle_param:
            qs = qs.filter(vehicle_id=vehicle_param)

        driver_param = self.request.query_params.get("driver")
        if driver_param:
            qs = qs.filter(driver_id=driver_param)

        return qs
