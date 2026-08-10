import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";

import sealUrl from "../../assets/brand/nasf-seal.jpg";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { useAuth } from "./AuthContext";

const schema = z.object({
  username: z.string().min(1, "اسم المستخدم مطلوب"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

  // Already logged in (e.g. navigated back to /login manually) — bounce
  // straight to the app instead of showing the form again.
  if (!isLoading && isAuthenticated) {
    return <Navigate to={location.state?.from?.pathname ?? "/"} replace />;
  }

  async function onSubmit(values) {
    setServerError("");
    try {
      await login(values.username, values.password);
      navigate(location.state?.from?.pathname ?? "/", { replace: true });
    } catch (error) {
      setServerError(
        error.response?.status === 401
          ? "اسم المستخدم أو كلمة المرور غير صحيحة"
          : "تعذر تسجيل الدخول، حاول مرة أخرى"
      );
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <img
            src={sealUrl}
            alt="شعار الجهاز الوطني للقوى المساندة"
            className="h-20 w-20 rounded-full object-cover shadow"
          />
          <div>
            <h1 className="text-lg font-bold">الجهاز الوطني للقوى المساندة</h1>
            <p className="text-sm text-muted-foreground">تسجيل الدخول إلى النظام</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-1.5">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input id="username" autoComplete="username" {...register("username")} />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password")}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "جارِ الدخول..." : "دخول"}
          </Button>
        </form>
      </div>
    </div>
  );
}
