import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/AdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Please log in to access the administrative interface.
            </p>
            <a 
              href="/api/login"
              className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Login
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminEmail = user?.email;
  const isAuthorizedAdmin = adminEmail === "russell@russellnomer.com" || 
                           (adminEmail && adminEmail.endsWith("@lotteryproapp.com"));

  if (!isAuthorizedAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <ShieldCheckIcon className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-2">
              Administrative access is restricted to authorized personnel only.
            </p>
            <p className="text-sm text-gray-500">
              Your email: {adminEmail}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Contact russell@russellnomer.com for access requests.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdminDashboard adminEmail={adminEmail} />;
}