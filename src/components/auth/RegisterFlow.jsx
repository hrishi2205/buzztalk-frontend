import React, { useState } from "react";
import { apiRequest } from "../../../utils/api";
import { generateKeyPair, exportKey } from "../../../utils/crypto";

const RegisterFlow = ({ setView, onRegisterSuccess }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleStep1 = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await apiRequest("auth/register/initiate", "POST", { email });
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await apiRequest("auth/register/verify", "POST", {
        email,
        otp,
      });
      setVerificationToken(res.verificationToken);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const keyPair = await generateKeyPair();
      const privateKey = await exportKey(keyPair.privateKey);
      const publicKey = await exportKey(keyPair.publicKey);

      const userData = await apiRequest("auth/register/complete", "POST", {
        verificationToken,
        username: username.toLowerCase(),
        password,
        publicKey,
      });

      localStorage.setItem(`privateKey_${userData.username}`, privateKey);
      onRegisterSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleStep1}>
            <h2 className="text-3xl font-extrabold mb-6 text-center text-amber-600">
              Step 1: Start Your Journey 🐝
            </h2>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
            >
              {isLoading ? "Sending..." : "Continue"}
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleStep2}>
            <h2 className="text-3xl font-extrabold mb-2 text-center text-amber-600">
              Step 2: Verify Your Hive
            </h2>
            <p className="text-center text-slate-600 mb-6">
              An OTP has been sent to <b>{email}</b>.
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="Enter 6-digit OTP"
              className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
            >
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleStep3}>
            <h2 className="text-3xl font-extrabold mb-6 text-center text-amber-600">
              Step 3: Join the Buzz
            </h2>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Create a unique username"
              className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
              pattern="^[a-zA-Z0-9_]{3,15}$"
              title="Username must be 3-15 characters (letters, numbers, underscores)."
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Create a strong password"
              className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-colors disabled:bg-slate-400"
            >
              {isLoading ? "Finishing..." : "Finish & Login"}
            </button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-yellow-50 to-amber-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm border border-amber-200">
        {renderStep()}
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
        <p className="text-center mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => setView("login")}
            className="text-amber-600 hover:underline font-semibold"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterFlow;
