"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/test-auth");
      const data = await response.json();
      console.log("API Response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("API Error:", error);
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  const testMiddlewareProtectedRoute = async () => {
    setLoading(true);
    try {
      // 测���受中间件保护的路由
      const response = await fetch("/api/user/profile");
      const data = await response.json();
      console.log("Protected Route Response:", data);
      alert(JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Protected Route Error:", error);
      alert("Error: " + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">认证测试页面</h1>

        {/* Session Status */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Session Status: {status}</h2>
          {session ? (
            <div className="space-y-2">
              <p><strong>Logged in as:</strong> {session.user?.email}</p>
              <p><strong>Name:</strong> {session.user?.name}</p>
              <p><strong>User ID:</strong> {session.user?.id}</p>
              <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          ) : (
            <p>Not logged in</p>
          )}
        </div>

        {/* Auth Actions */}
        <div className="space-y-4">
          {!session ? (
            <button
              onClick={() => signIn()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* API Tests */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">API Tests</h2>

          <button
            onClick={testApiCall}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Test Auth API"}
          </button>

          <button
            onClick={testMiddlewareProtectedRoute}
            disabled={loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Test Protected Route (Middleware)"}
          </button>
        </div>

        {/* Test Links */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Test Links</h2>
          <ul className="space-y-1">
            <li><a href="/prompts" className="text-blue-500 hover:underline">Test /prompts (protected by middleware)</a></li>
            <li><a href="/me" className="text-blue-500 hover:underline">Test /me (protected by middleware)</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}