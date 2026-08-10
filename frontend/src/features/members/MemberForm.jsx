import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

import { AuthedImage } from "../../components/ui/AuthedImage";
import { Button } from "../../components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { factionsApi, ranksApi } from "../organization/api";
import { useCreateMember, useMember, useUpdateMember } from "./api";
import { BLOOD_TYPE_OPTIONS } from "./constants";

const schema = z.object({
  first_name: z.string().min(1, "الاسم الأول مطلوب"),
  second_name: z.string().min(1, "اسم الأب مطلوب"),
  third_name: z.string().optional(),
  last_name: z.string().min(1, "اللقب مطلوب"),
  force_number: z.string().min(1, "الرقم الحربي مطلوب"),
  national_number: z
    .string()
    .min(1, "الرقم الوطني مطلوب")
    .regex(/^[0-9٠-٩]{12}$/, "يجب أن يتكون الرقم الوطني من 12 رقماً"),
  date_of_birth: z.string().optional(),
  place_of_birth: z.string().optional(),
  blood_type: z.string().optional(),
  rank: z.string().min(1, "الرتبة مطلوبة"),
  faction: z.string().min(1, "الفصيل مطلوب"),
  phone: z.string().optional(),
  pledges: z.string().optional(),
  join_date: z.string().optional(),
});

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

  const form = useForm({ resolver: zodResolver(schema), defaultValues: emptyDefaults });

  useEffect(() => {
    if (!member) return;
    form.reset({
      first_name: member.first_name,
      second_name: member.second_name,
      third_name: member.third_name ?? "",
      last_name: member.last_name,
      force_number: member.force_number,
      national_number: member.national_number,
      date_of_birth: member.date_of_birth ?? "",
      place_of_birth: member.place_of_birth ?? "",
      blood_type: member.blood_type ?? "",
      rank: String(member.rank ?? ""),
      faction: String(member.faction ?? ""),
      phone: member.phone ?? "",
      pledges: member.pledges ?? "",
      join_date: member.join_date ?? "",
    });
  }, [member, form]);

  async function onSubmit(values) {
    setServerError("");
    const payload = { ...values };
    if (photoFile) payload.photo_upload = photoFile;

    try {
      if (isEdit) {
        await updateMember.mutateAsync({ id, ...payload });
        navigate(`/members/${id}`);
      } else {
        const created = await createMember.mutateAsync(payload);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "تعديل بيانات العضو" : "إضافة عضو جديد"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-4">
            <AuthedImage
              src={photoFile ? undefined : member?.photo_url}
              alt="صورة العضو"
              className="h-20 w-20 rounded-full border border-border"
            />
            <div className="space-y-1">
              <Label htmlFor="photo">الصورة الشخصية</Label>
              <input
                id="photo"
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="block text-sm text-muted-foreground file:me-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:text-secondary-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="الاسم الأول" error={form.formState.errors.first_name}>
              <Input {...form.register("first_name")} />
            </Field>
            <Field label="اسم الأب" error={form.formState.errors.second_name}>
              <Input {...form.register("second_name")} />
            </Field>
            <Field label="اسم الجد" error={form.formState.errors.third_name}>
              <Input {...form.register("third_name")} />
            </Field>
            <Field label="اللقب" error={form.formState.errors.last_name}>
              <Input {...form.register("last_name")} />
            </Field>

            <Field label="الرقم الحربي" error={form.formState.errors.force_number}>
              <Input dir="ltr" {...form.register("force_number")} />
            </Field>
            <Field label="الرقم الوطني" error={form.formState.errors.national_number}>
              <Input dir="ltr" {...form.register("national_number")} />
            </Field>
            <Field label="تاريخ الميلاد" error={form.formState.errors.date_of_birth}>
              <Input type="date" {...form.register("date_of_birth")} />
            </Field>
            <Field label="مكان الميلاد" error={form.formState.errors.place_of_birth}>
              <Input {...form.register("place_of_birth")} />
            </Field>

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
            <Field label="رقم الهاتف" error={form.formState.errors.phone}>
              <Input dir="ltr" {...form.register("phone")} />
            </Field>

            <Field label="تاريخ الالتحاق" error={form.formState.errors.join_date}>
              <Input type="date" {...form.register("join_date")} />
            </Field>
          </div>

          <Field label="التعهدات" error={form.formState.errors.pledges}>
            <Textarea rows={4} {...form.register("pledges")} />
          </Field>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              حفظ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error.message}</p>}
    </div>
  );
}
