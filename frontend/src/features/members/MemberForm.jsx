import { useEffect, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { User, Shield, FileText, Image } from "lucide-react";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { Combobox } from "../../components/ui/Combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../../components/ui/Dialog";
import { FieldError } from "../../components/ui/FieldError";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { PageHeader } from "../../components/ui/PageHeader";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { factionsApi, ranksApi } from "../organization/api";
import { useFieldRequirements } from "../settings/api";
import { useCreateMember, useMember, useUpdateMember } from "./api";
import { BLOOD_TYPE_OPTIONS } from "./constants";
import { showToast } from "../../components/ui/Toast";
import { FormSection } from "../../components/ui/FormSection";
import { LocationMapPicker } from "../../components/ui/LocationMapPicker";

const emptyDefaults = {
  first_name: "",
  second_name: "",
  third_name: "",
  last_name: "",
  force_number: "",
  national_number: "",
  id_card_number: "",
  passport_number: "",
  date_of_birth: "",
  place_of_birth: "",
  blood_type: "",
  mother_name: "",
  current_residence: "",
  nearest_landmark: "",
  location_url: "",
  latitude: "",
  longitude: "",
  rank: "",
  faction: "",
  phone: "",
  pledges: "",
  join_date: "",
};

export function MemberForm() {
  const { data: requirements = [], isLoading: isRequirementsLoading } = useFieldRequirements();

  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const { data: member } = useMember(id);
  const { data: ranks = [] } = ranksApi.useList({ ordering: "order" });
  const { data: factions = [] } = factionsApi.useList({ ordering: "name_ar" });

  const activeRanks = ranks.filter((r) => r.is_active || (isEdit && member?.rank === r.id));
  const activeFactions = factions.filter((f) => f.is_active || (isEdit && member?.faction === f.id));

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const [photoFile, setPhotoFile] = useState(null);
  const [serverError, setServerError] = useState("");

  if (isRequirementsLoading) {
    return <p className="p-8 text-center text-body text-muted-foreground">جارِ تحميل إعدادات الحقول والمتطلبات...</p>;
  }

  return (
    <MemberFormInner 
      requirements={requirements} 
      member={member} 
      activeRanks={activeRanks} 
      activeFactions={activeFactions}
      photoFile={photoFile}
      setPhotoFile={setPhotoFile}
      serverError={serverError}
      setServerError={setServerError}
    />
  );
}

function MemberFormInner({ requirements, member, activeRanks, activeFactions, photoFile, setPhotoFile, serverError, setServerError }) {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const createMember = useCreateMember();
  const updateMember = useUpdateMember();

  const [blockNext, setBlockNext] = useState(null);

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

  // Unsaved-changes guard: block navigation (SPA + tab close) while the form
  // is dirty and the user has not just submitted.
  const formRef = useRef(form);
  formRef.current = form;
  const submittedRef = useRef(false);
  const isDirty = form.formState.isDirty && !submittedRef.current;

  const blocker = useBlocker(isDirty);
  useEffect(() => {
    if (blocker.state === "blocked") setBlockNext(true);
    if (blocker.state === "proceeding") setBlockNext(false);
  }, [blocker.state]);

  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  async function onSubmit(values) {
    submittedRef.current = true;
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
        showToast("تم تحديث بيانات الفرد بنجاح");
        navigate(`/members/${id}`);
      } else {
        const created = await createMember.mutateAsync(payload);
        showToast("تم إنشاء ملف الفرد بنجاح");
        navigate(`/members/${created.id}`);
      }
    } catch (error) {
      console.error("Member save error:", error);
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 403) {
        setServerError("عفواً، لا يمتلك حسابك الحالي الصلاحية الأمنية الكافية لتسجيل أو تعديل بيانات الأفراد (مطلوب صلاحية member.create / member.edit).");
      } else if (status === 500) {
        setServerError("حدث خطأ داخلي في الخادم (500) — يرجى التأكد من تشغيل ترحيل الجداول (python manage.py migrate) والتأكد من أذونات مجلد التخزين.");
      } else if (data && typeof data === "object") {
        if (data.detail) {
          setServerError(data.detail);
        } else if (data.missing_required_fields) {
          setServerError(data.missing_required_fields);
        } else {
          const messages = Object.entries(data).map(([field, msg]) => {
            const fieldText = typeof msg === "string" ? msg : Array.isArray(msg) ? msg.join(", ") : JSON.stringify(msg);
            return `${fieldText}`;
          });
          setServerError(messages.join(" — "));
        }
      } else if (error.message) {
        setServerError(`تعذر الاتصال بالخادم: ${error.message}`);
      } else {
        setServerError("تعذر حفظ بيانات الفرد — يرجى مراجعة البيانات المدخلة والمحاولة مرة أخرى.");
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

  const hasMissingMasterData = activeRanks.length === 0 || activeFactions.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? "تعديل استمارة الفرد" : "تسجيل فرد جديد بالقوة"}
        description="يرجى تعبئة كافة الحقول المطلوبة للتأكد من اكتمال الملف العسكري."
      />

      {hasMissingMasterData && (
        <div role="alert" className="max-w-4xl mx-auto rounded-control border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-4 text-body font-semibold text-amber-800 dark:text-amber-200">
          ⚠️ تنبيه: {activeRanks.length === 0 && "لا توجد رتب عسكرية مسجلة. "} {activeFactions.length === 0 && "لا توجد إدارات أو فصائل مسجلة. "}
          يرجى تهيئة الرتب والإدارات من قسم الإعدادات أولاً أو تشغيل أمر التهيئة (setup_system) لتتمكن من اختيار الرتبة والإدارة وحفظ الفرد بنجاح.
        </div>
      )}

      <Card className="max-w-4xl mx-auto shadow-md border-border/50 animate-slide-up">
        <CardContent className="p-6 md:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Top-of-form error summary */}
          {Object.keys(form.formState.errors).length > 0 && (
            <div role="alert" className="rounded-control border border-danger-border bg-danger-surface px-4 py-3 text-body font-semibold text-danger">
              هناك خطأ أو أكثر في النموذج أعلاه. يرجى تصحيحها ثم إعادة التقديم.
            </div>
          )}
          {serverError && (
            <div role="alert" className="rounded-control border border-danger-border bg-danger-surface px-4 py-3 text-body font-semibold text-danger">
              {serverError}
            </div>
          )}

          {/* Section 1: Personal Info */}
          {showSection1 && (
            <FormSection icon={User} title="البيانات الشخصية">
              {isVisible("photo") && (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-secondary/10 p-4 rounded-xl border border-border/50">
                  <div className="relative shrink-0">
                    <AuthedImage
                      src={photoFile ? undefined : member?.photo_url}
                      alt="صورة الفرد"
                      className="h-20 w-20 rounded-full border-2 border-border shadow object-cover"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white text-caption font-bold cursor-pointer">
                      تعديل
                    </div>
                  </div>
                  <div className="space-y-1.5 flex-1 w-full text-center sm:text-start">
                    <Label htmlFor="photo" className="font-bold text-caption text-foreground">الصورة الشخصية</Label>
                    <div className="relative border border-dashed border-border hover:border-primary/50 bg-card rounded-lg p-3 transition-colors cursor-pointer flex flex-col items-center justify-center gap-1">
                      <Image className="h-5 w-5 text-muted-foreground" />
                      <span className="text-caption text-muted-foreground font-bold">اسحب الصورة أو اضغط هنا للاختيار</span>
                      <input
                        id="photo"
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                    {photoFile && (
                      <p className="text-caption text-success font-semibold">تم اختيار ملف: {photoFile.name}</p>
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

                {isVisible("mother_name") && (
                  <Field label="اسم الأم" error={form.formState.errors.mother_name}>
                    <Input {...form.register("mother_name")} />
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
                {isVisible("id_card_number") && (
                  <Field label="رقم الهوية شخصية" error={form.formState.errors.id_card_number}>
                    <Input dir="ltr" {...form.register("id_card_number")} />
                  </Field>
                )}
                {isVisible("passport_number") && (
                  <Field label="رقم جواز السفر" error={form.formState.errors.passport_number}>
                    <Input dir="ltr" {...form.register("passport_number")} />
                  </Field>
                )}
                {isVisible("phone") && (
                  <Field label="رقم الهاتف" error={form.formState.errors.phone}>
                    <Input dir="ltr" {...form.register("phone")} />
                  </Field>
                )}
                {isVisible("current_residence") && (
                  <Field label="السكن الحالي" error={form.formState.errors.current_residence}>
                    <Input {...form.register("current_residence")} />
                  </Field>
                )}
                {isVisible("nearest_landmark") && (
                  <Field label="أقرب نقطة دالة" error={form.formState.errors.nearest_landmark}>
                    <Input {...form.register("nearest_landmark")} />
                  </Field>
                )}
              </div>

              {isVisible("location_url") && (
                <LocationMapPicker
                  locationUrl={form.watch("location_url")}
                  onChange={({ locationUrl }) => {
                    form.setValue("location_url", locationUrl);
                  }}
                />
              )}
            </FormSection>
          )}

          {/* Section 2: Military/Department Info */}
          {showSection2 && (
            <FormSection icon={Shield} title="البيانات العسكرية والتنظيمية">
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
                  <Controller
                    name="rank"
                    control={form.control}
                    render={({ field }) => (
                      <Field label="الرتبة" error={form.formState.errors.rank} htmlFor="member-rank">
                        <Combobox
                          id="member-rank"
                          options={activeRanks.map((r) => ({ value: r.id, label: r.name_ar }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="اختر الرتبة"
                          searchPlaceholder="بحث عن رتبة..."
                        />
                      </Field>
                    )}
                  />
                )}
                {isVisible("faction") && (
                  <Controller
                    name="faction"
                    control={form.control}
                    render={({ field }) => (
                      <Field label="الإدارة" error={form.formState.errors.faction} htmlFor="member-faction">
                        <Combobox
                          id="member-faction"
                          options={activeFactions.map((f) => ({ value: f.id, label: f.name_ar }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="اختر الإدارة"
                          searchPlaceholder="بحث عن إدارة..."
                        />
                      </Field>
                    )}
                  />
                )}
              </div>
            </FormSection>
          )}

          {serverError && <p className="text-body text-destructive font-bold">{serverError}</p>}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {isEdit ? "حفظ التعديلات" : "إنشاء الملف"}
            </Button>
          </div>
        </form>

        {/* Unsaved-changes confirmation */}
        <Dialog open={Boolean(blockNext)} onOpenChange={(open) => { if (!open) setBlockNext(null); }}>
          <DialogContent className="w-[min(92vw,28rem)]">
            <DialogHeader>
              <DialogTitle>مغادرة دون حفظ؟</DialogTitle>
              <DialogDescription>
                لديك تغييرات غير محفوظة في هذا النموذج. سيتم فقدانها إذا غادرت الآن.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { blocker?.reset?.(); setBlockNext(null); }}>
                البقاء في النموذج
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  submittedRef.current = true;
                  setBlockNext(null);
                  blocker?.proceed?.();
                }}
              >
                مغادرة وفقدان التغييرات
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </div>
  );
}

function Field({ label, error, htmlFor, children }) {
  return (
    <div className="space-y-1.5 animate-fade-in">
      <Label htmlFor={htmlFor} className="text-caption font-bold text-foreground">{label}</Label>
      {children}
      <FieldError>{error?.message}</FieldError>
    </div>
  );
}

export default MemberForm;
