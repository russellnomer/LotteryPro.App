import AdminDashboard from "@/components/AdminDashboard";
import VipCodeRedemption from "@/components/VipCodeRedemption";

export default function AdminPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <AdminDashboard />
      
      <div className="border-t pt-8">
        <h2 className="text-2xl font-bold text-center mb-6">Test VIP Code Redemption</h2>
        <VipCodeRedemption userEmail="test@example.com" />
      </div>
    </div>
  );
}