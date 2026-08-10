import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { User, Shield, FileText, Image } from "lucide-react";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { factionsApi, ranksApi } from "../organization/api";
import { useFieldRequirements } from "../settings/api";
import { useCreateMember, useMember, useUpdateMember } from "./api";
import { BLOOD_TYPE_OPTIONS } from "./constants";
import { showToast } from "../../components/ui/Toast";

const emptyDefaults = {
  first_name: "",
  second_name: "",
  third_name: "",
  last_name: "",
  force_number: "",
  national_number: "",
  date_of_birth: "",
  place_of_birth: "",
  blood_type: "",
  rank: "",
  faction: "",
  phone: "",
  pledges: "",
  join_date: "",
};

export function MemberForm() {
  const { data: requirements = [], isLoading: isRequirementsLoading } = useFieldRequirements();

  if (isRequirementsLoading) {
    return <p className="p-8 text-center text-sm text-muted-foreground">جارِ تحميل إعدادات الحقول والمتطلبات...</p>;
  }

  return <MemberFormInner requirements={requirements} />;
}

function MemberFormInner({ requirements }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: member } = useMember(id);
  const { data: ranks = [] } = ranksApi.useList({ ordering: "order" });
  const { data: factions = [] } = factionsApi.useList({ ordering: "name_ar" });
  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const [photoFile, setPhotoFile] = useState(null);
  const [serverError, setServerError] = useState("");

  // Build the Zod validation schema dynamically based on database requirements
  const dynamicShape = {};
  requirements.forEach((req) => {
    const isRequired = req.is_required || !req.lockable;

    if (req.field_key === "national_number") {
      let natSchema = z.string();
      if (isRequired) {
        natSchema = natSchema.min(1, "الرقم الوطني مطلوب");
      } else {
        natSchema = natSchema.optional().or(z.literal(""));
      }
      dynamicShape.national_number = natSchema.refine(
        (val) => !val || /^[0-9٠-٩]{12}$/.test(val),
        "يجب أن يتكون الرقم الوطني من 12 رقماً"
      );
    } else {
      let fieldSchema = z.string();
      if (isRequired) {
        fieldSchema = fieldSchema.min(1, `${req.label_ar} مطلوب`);
      } else {
        fieldSchema = fieldSchema.optional().or(z.literal(""));
      }
      dynamicShape[req.field_key] = fieldSchema;
    }
  });

  const schema = z.object(dynamicShape);
  const form = useForm({ resolver: zodResolver(schema), defaultValues: emptyDefaults });

  useEffect(() => {
    if (!member) return;
    form.reset({
      first_name: member.first_name || "",
      second_name: member.second_name || "",
      third_name: member.third_name || "",
      last_name: member.last_name || "",
      force_number: member.force_number || "",
      national_number: member.national_number || "",
      date_of_birth: member.date_of_birth || "",
      place_of_birth: member.place_of_birth || "",
      blood_type: member.blood_type || "",
      rank: String(member.rank ?? ""),
      faction: String(member.faction ?? ""),
      phone: member.phone || "",
      pledges: member.pledges || "",
      join_date: member.join_date || "",
    });
  }, [member, form]);

  async function onSubmit(values) {
    setServerError("");
    const payload = { ...values };
    if (photoFile) payload.photo_upload = photoFile;

    // Filter out fields that are marked as hidden (is_visible === false)
    requirements.forEach((req) => {
      if (!req.is_visible) {
        delete payload[req.field_key];
      }
    });

    try {
      if (isEdit) {
        await updateMember.mutateAsync({ id, ...payload });
        showToast("تم تحديث بيانات العضو بنجاح");
        navigate(`/members/${id}`);
      } else {
        const created = await createMember.mutateAsync(payload);
        showToast("تم إنشاء ملف العضو بنجاح");
        navigate(`/members/${created.id}`);
      }
    } catch (error) {
      const data = error.response?.data;
      if (data && typeof data === "object") {
        setServerError(Object.values(data).flat().join(" — "));
      } else {
        setServerError("تعذر حفظ بيانات العضو.");
      }
    }
  }

  // Helper to check visibility from settings registry
  function isVisible(fieldKey) {
    const req = requirements.find((r) => r.field_key === fieldKey);
    return req ? req.is_visible : true;
  }

  // Section visibility check
  const showSection1 = ["first_name", "second_name", "third_name", "last_name", "date_of_birth", "place_of_birth", "blood_type", "photo", "national_number", "phone"].some(isVisible);
  const showSection2 = ["force_number", "rank", "faction", "join_date"].some(isVisible);
  const showSection3 = ["pledges"].some(isVisible);

  return (
    <Card className="glass-card max-w-4xl mx-auto shadow-md border-border/50 animate-slide-up">
      <CardHeader className="border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-black">
            {isEdit ? "تعديل استمارة العضو" : "تسجيل عضو جديد بالقوة"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            يرجى تعبئة كافة الحقول المطلوبة للتأكد من اكتمال الملف العسكري.
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-6 md:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Section 1: Personal Info */}
          {showSection1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 text-primary">
                <User className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-sm">البيانات الشخصية</h3>
              </div>

              {isVisible("photo") && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                  <div className="relative shrink-0">
                    <AuthedImage
                      src={photoFile ? undefined : member?.photo_url}
                      alt="صورة العضو"
                      className="h-20 w-20 rounded-full border-2 border-border shadow object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold cursor-pointer">
                      تعديل
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 w-full text-center sm:text-start">
                    <Label htmlFor="photo" className="font-bold text-xs text-foreground">الصورة الشخصية</Label>
                    <div className="relative border border-dashed border-border hover:border-primary/50 bg-card rounded-lg p-3 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground font-bold">اسحب الصورة أو اضغط هنا للاختيار</span>
                      <input
                        id="photo"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {photoFile && (
                      <p className="text-[10px] text-success font-semibold">تم اختيار ملف: {photoFile.name}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {isVisible("first_name") && (
                  <Field label="الاسم الأول" error={form.formState.errors.first_name}>
                    <Input {...form.register("first_name")} />
                  </Field>
                )}
                {isVisible("second_name") && (
                  <Field label="اسم الأب" error={form.formState.errors.second_name}>
                    <Input {...form.register("second_name")} />
                  </Field>
                )}
                {isVisible("third_name") && (
                  <Field label="اسم الجد" error={form.formState.errors.third_name}>
                    <Input {...form.register("third_name")} />
                  </Field>
                )}
                {isVisible("last_name") && (
                  <Field label="اللقب" error={form.formState.errors.last_name}>
                    <Input {...form.register("last_name")} />
                  </Field>
                )}

                {isVisible("date_of_birth") && (
                  <Field label="تاريخ الميلاد" error={form.formState.errors.date_of_birth}>
                    <Input type="date" {...form.register("date_of_birth")} />
                  </Field>
                )}
                {isVisible("place_of_birth") && (
                  <Field label="مكان الميلاد" error={form.formState.errors.place_of_birth}>
                    <Input {...form.register("place_of_birth")} />
                  </Field>
                )}
                {isVisible("blood_type") && (
                  <Field label="فصيلة الدم" error={form.formState.errors.blood_type}>
                    <Select {...form.register("blood_type")}>
                      <option value="">—</option>
                      {BLOOD_TYPE_OPTIONS.map((bt) => (
                        <option key={bt} value={bt}>
                          {bt}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                {isVisible("national_number") && (
                  <Field label="الرقم الوطني" error={form.formState.errors.national_number}>
                    <Input dir="ltr" maxLength={12} {...form.register("national_number")} />
                  </Field>
                )}
                {isVisible("phone") && (
                  <Field label="رقم الهاتف" error={form.formState.errors.phone}>
                    <Input dir="ltr" {...form.register("phone")} />
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Military/Department Info */}
          {showSection2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 text-primary">
                <Shield className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-sm">البيانات العسكرية والتنظيمية</h3>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {isVisible("force_number") && (
                  <Field label="الرقم الحربي" error={form.formState.errors.force_number}>
                    <Input dir="ltr" {...form.register("force_number")} />
                  </Field>
                )}
                {isVisible("join_date") && (
                  <Field label="تاريخ الالتحاق" error={form.formState.errors.join_date}>
                    <Input type="date" {...form.register("join_date")} />
                  </Field>
                )}
                {isVisible("rank") && (
                  <Field label="الرتبة" error={form.formState.errors.rank}>
                    <Select {...form.register("rank")}>
                      <option value="">اختر الرتبة</option>
                      {ranks.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name_ar}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
                {isVisible("faction") && (
                  <Field label="الفصيل" error={form.formState.errors.faction}>
                    <Select {...form.register("faction")}>
                      <option value="">اختر الفصيل</option>
                      {factions.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name_ar}
                        </option>
                      ))}
                    </Select>
                  </Field>
                )}
              </div>
            </div>
          )}

          {/* Section 3: Pledges */}
          {showSection3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2 text-primary">
                <FileText className="h-5 w-5 shrink-0" />
                <h3 className="font-bold text-sm">التعهدات</h3>
              </div>

              {isVisible("pledges") && (
                <Field label="التعهدات والالتزامات العسكرية" error={form.formState.errors.pledges}>
                  <Textarea rows={4} {...form.register("pledges")} />
                </Field>
              )}
            </div>
          )}

          {serverError && <p className="text-sm text-destructive font-bold">{serverError}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "حفظ التعديلات" : "إنشاء الملف"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5 animate-fade-in">
      <Label className="text-xs font-bold text-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive font-medium">{error.message}</p>}
    </div>
  );
}
