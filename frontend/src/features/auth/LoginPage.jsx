import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { User, Lock, Eye, EyeOff, ShieldCheck, Loader2, AlertCircle } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) });

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
          : "تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى"
      );
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-slate-50 p-4 text-foreground dir-rtl" dir="rtl">
      {/* Background Decorative Pattern & Gradient Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/5 via-slate-100/60 to-slate-200/40 pointer-events-none" />
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-900/10 blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="rounded-3xl border border-border/80 bg-card/95 p-8 shadow-xl backdrop-blur-xl transition-all sm:p-10 space-y-6">
          {/* Header Branding Section */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500 to-primary opacity-30 blur transition group-hover:opacity-50" />
              <img
                src={sealUrl}
                alt="شعار الجهاز الوطني للقوى المساندة"
                className="relative h-24 w-24 rounded-full object-cover shadow-md ring-4 ring-background border border-amber-500/30"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <h1 className="text-section font-extrabold text-foreground tracking-tight">
                الجهاز الوطني للقوى المساندة
              </h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-caption">
                <span>الوحدة القتالية الرابعة</span>
              </div>
              <p className="text-body-sm text-muted-foreground pt-1">
                منظومة التوثيق وإدارة شؤون الأفراد والعتاد
              </p>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            {/* Server Error Alert */}
            {serverError && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-body-sm font-semibold animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5 text-start">
              <Label htmlFor="username" className="font-bold text-body-sm text-foreground">
                اسم المستخدم
              </Label>
              <div className="relative">
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="أدخل اسم المستخدم..."
                  dir="ltr"
                  className="ps-10 font-mono text-body-sm h-11 rounded-xl"
                  {...register("username")}
                />
                <User className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {errors.username && (
                <p className="text-caption text-destructive font-semibold flex items-center gap-1 pt-0.5">
                  <span>{errors.username.message}</span>
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-1.5 text-start">
              <Label htmlFor="password" className="font-bold text-body-sm text-foreground">
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="أدخل كلمة المرور..."
                  dir="ltr"
                  className="ps-10 pe-10 font-mono text-body-sm h-11 rounded-xl"
                  {...register("password")}
                />
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                  title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-caption text-destructive font-semibold flex items-center gap-1 pt-0.5">
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold text-body-sm shadow-md transition-all mt-2 text-white bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>جارِ التحقق والتسجيل...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>تسجيل الدخول إلى النظام</span>
                </span>
              )}
            </Button>
          </form>

          {/* Security Badge Footer */}
          <div className="pt-2 border-t border-border/60 text-center">
            <div className="inline-flex items-center gap-1.5 text-caption font-semibold text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>نظام موثق ومشفّر — للاستخدام الإداري المعتمد فقط</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
