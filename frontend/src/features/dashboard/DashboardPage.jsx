import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { useAuth } from "../auth/AuthContext";

export function DashboardPage() {
  const { user } = useAuth();
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>مرحباً، {displayName}</CardTitle>
          <CardDescription>
            نظام إدارة أعضاء الجهاز الوطني للقوى المساندة. المزيد من الإحصائيات ستُضاف هنا لاحقاً.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          استخدم القائمة الجانبية للانتقال إلى الرتب والفصائل.
        </CardContent>
      </Card>
    </div>
  );
}
