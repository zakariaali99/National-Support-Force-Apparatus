from rest_framework import viewsets


class SoftDeleteModelViewSet(viewsets.ModelViewSet):
    """A ModelViewSet whose DELETE action soft-deletes instead of removing
    the row. Every model that matters here (ranks, factions, members, ...)
    extends apps.core.models.base.BaseModel, which already implements
    soft_delete()/restore() correctly (see base.py for the base_manager_name
    fix) — this just wires the DRF destroy action to call it instead of the
    default hard delete.
    """

    def perform_destroy(self, instance):
        instance.soft_delete()
