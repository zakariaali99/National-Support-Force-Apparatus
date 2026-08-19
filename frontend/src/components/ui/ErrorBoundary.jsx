import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./Button";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B132B] p-4 text-center">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-[#15203D] border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/5">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-title font-bold text-slate-900 dark:text-white">
                حدث خطأ غير متوقع أثناء معالجة الصفحة
              </h2>
              <p className="text-body-sm text-slate-600 dark:text-gray-300">
                تعذر تحميل بعض عناصر الواجهة مؤقتاً. يمكنك محاولة إعادة تحديث الصفحة أو العودة للرئيسية.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-start">
                  <p className="text-caption font-mono text-rose-700 dark:text-rose-300 dir-ltr break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={this.handleHome}
                className="gap-2 rounded-xl px-4 font-bold border-slate-200 dark:border-white/10"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </Button>
              <Button
                onClick={this.handleReset}
                className="gap-2 rounded-xl px-5 font-bold bg-[#2B95E8] hover:bg-[#2582cb]"
              >
                <RefreshCw className="w-4 h-4" />
                إعادة المحاولة
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
