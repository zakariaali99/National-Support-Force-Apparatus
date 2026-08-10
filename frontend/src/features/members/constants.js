// Mirrors apps.members.models.member choices on the backend — keep these
// two lists in sync if the backend choices change.
export const BLOOD_TYPE_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export const SERVICE_STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "suspended", label: "موقوف" },
  { value: "on_leave", label: "في إجازة" },
  { value: "retired", label: "متقاعد" },
  { value: "deceased", label: "متوفى" },
];

export const APPROVAL_STATUS_OPTIONS = [
  { value: "draft", label: "مسودة" },
  { value: "pending", label: "بانتظار الاعتماد" },
  { value: "approved", label: "معتمد" },
  { value: "rejected", label: "مرفوض" },
];

export function serviceStatusLabel(value) {
  return SERVICE_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function approvalStatusLabel(value) {
  return APPROVAL_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
