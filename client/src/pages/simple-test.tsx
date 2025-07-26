export default function SimpleTest() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎰 LotteryPro Admin Test
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Testing basic functionality
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p>✅ React is working</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p>✅ Tailwind CSS is working</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p>🔑 Admin system ready</p>
          </div>
        </div>
        <div className="mt-8">
          <a href="/admin" className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors">
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}