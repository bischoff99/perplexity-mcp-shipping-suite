export default function DashboardPage() {
  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Shipping Dashboard
          </h1>
          <p className="text-gray-600 mb-8">
            Welcome to the Perplexity Shipping Suite Dashboard
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">EasyPost MCP</h3>
              <p className="text-sm text-gray-600 mb-4">15 shipping tools operational</p>
              <div className="text-2xl font-bold text-blue-600">Port 3000</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Veeqo MCP</h3>
              <p className="text-sm text-gray-600 mb-4">37 inventory tools operational</p>
              <div className="text-2xl font-bold text-green-600">Port 3002</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Web Dashboard</h3>
              <p className="text-sm text-gray-600 mb-4">Next.js 15 with App Router</p>
              <div className="text-2xl font-bold text-purple-600">Port 3003</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
