import React, { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, uploadAvatarFile } from "../../../utils/api";
import { generateKeyPair, exportKey } from "../../../utils/crypto";

const RegisterFlow = ({ setView, onRegisterSuccess }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
      const msg = /<\s*!DOCTYPE|<\s*html/i.test(err.message || "")
        ? "Server error. Please try again later."
        : err.message;
      setError(msg);
      toast.error(msg);
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
      const msg = /<\s*!DOCTYPE|<\s*html/i.test(err.message || "")
        ? "Server error. Please try again later."
        : err.message;
      setError(msg);
      toast.error(msg);
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
      const privateKey = await exportKey(keyPair.privateKey); // stringified JWK (for local storage)
      const publicKey = await exportKey(keyPair.publicKey); // stringified JWK

      // Backend expects a JWK object; send only the standard members (kty, crv, x, y)
      const jwk = JSON.parse(publicKey);
      const minimalJwk = {
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
      };
      const userData = await apiRequest("auth/register/complete", "POST", {
        verificationToken,
        username: username.toLowerCase(),
        password,
        displayName,
        avatarUrl, // optional URL path if user pasted one
        publicKey: minimalJwk,
        // Compatibility alias in case backend expects a different property name
        publicKeyJwk: minimalJwk,
      });

      localStorage.setItem(`privateKey_${userData.username}`, privateKey);
      // If an avatar file was selected, upload it and patch the profile
      if (avatarFile) {
        try {
          const { url } = await uploadAvatarFile(avatarFile, userData.token);
          const updated = await apiRequest(
            "users/profile",
            "PATCH",
            { avatarUrl: url },
            userData.token
          );
          userData.avatarUrl = updated.avatarUrl || url;
        } catch (e) {
          // Non-blocking: proceed even if avatar upload fails
          console.warn("Avatar upload during registration failed:", e.message);
        }
      }
      onRegisterSuccess(userData);
      toast.success("Registration successful! You’re in the hive 🐝", {
        icon: "🎉",
      });
    } catch (err) {
      const msg = /<\s*!DOCTYPE|<\s*html/i.test(err.message || "")
        ? "Server error. Please try again later."
        : err.message;
      setError(msg);
      toast.error(msg);
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
            <div className="relative mb-4">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="w-full pr-24 pl-4 py-3 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 m-1 rounded-md text-amber-700 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-sm font-medium"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              type="text"
              placeholder="Your name (display name)"
              className="w-full p-3 mb-4 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <div className="mb-4">
              <label className="block text-sm text-slate-700 mb-1">
                Avatar (optional)
              </label>
              <div className="flex items-center gap-3">
                {avatarFile ? (
                  <img
                    src={URL.createObjectURL(avatarFile)}
                    alt="preview"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="flex-1 text-sm"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                You can choose a file to upload. Alternatively, paste an image
                URL below.
              </p>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                type="url"
                placeholder="Or paste avatar URL"
                className="w-full p-3 mt-2 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
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
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200">
      <div className="w-full max-w-md p-8 rounded-3xl border bg-white/70 backdrop-blur-md border-amber-200 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        {renderStep()}
        {error && (
          <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
        )}
        <p className="text-center mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <button
            onClick={() => setView("login")}
            className="text-amber-700 hover:underline font-semibold"
          >
            Login here
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterFlow;
