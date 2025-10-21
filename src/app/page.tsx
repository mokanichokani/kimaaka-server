import { Suspense } from 'react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Kimaaka Server
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            API Server with Vercel Analytics & Speed Insights
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                📊 Analytics
              </h3>
              <p className="text-green-700">
                Track page views, user interactions, and performance metrics
              </p>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                ⚡ Speed Insights
              </h3>
              <p className="text-blue-700">
                Monitor Core Web Vitals and performance optimizations
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Available API Endpoints
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">GET /api/health</code>
                <p className="text-gray-600">Health check</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">POST /api/signup</code>
                <p className="text-gray-600">User registration</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">POST /api/login</code>
                <p className="text-gray-600">User authentication</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">GET /api/gemini-key</code>
                <p className="text-gray-600">API key request</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">POST /api/donate-key</code>
                <p className="text-gray-600">Key donation</p>
              </div>
              
              <div className="bg-gray-50 rounded p-3">
                <code className="text-blue-600">GET /api/admin/stats</code>
                <p className="text-gray-600">Admin statistics</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <p className="text-yellow-800">
              <strong>Analytics Active:</strong> This page is now being tracked by Vercel Analytics and Speed Insights.
              Visit your Vercel dashboard to view real-time metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}