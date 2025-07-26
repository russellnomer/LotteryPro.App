export default function SimpleTest() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">
          🎰 LotteryPro Test Page
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Testing basic functionality - navigation is now available in header
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p>✅ React is working</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p>✅ Tailwind CSS is working</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p>✅ Navigation header added</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <p>🔑 Admin system ready via header navigation</p>
          </div>
        </div>
        <div className="mt-8 text-sm text-gray-500">
          <p>Use the navigation header above to switch between:</p>
          <p>Main App • Music • Books • Performance • Admin Dashboard</p>
        </div>
      </div>
    </div>
  );
}