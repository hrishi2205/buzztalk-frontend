import React, { useState } from "react";
import { apiRequest } from "../../../utils/api";

const LoginView = ({ setView, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const userData = await apiRequest("auth/login", "POST", {
        loginIdentifier: identifier.toLowerCase(),
        password,
      });
      onLoginSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-amber-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-amber-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-amber-600">
          Welcome Back 🐝
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            placeholder="Email or Username"
            className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            required
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-slate-600">
          No account?{" "}
          <button
            onClick={() => setView("register")}
            className="text-amber-600 hover:underline font-semibold"
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginView;
