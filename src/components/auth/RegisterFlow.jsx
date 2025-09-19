import React, { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest, uploadAvatarFile } from "../../../utils/api";
import {
  generateKeyPair,
  exportKey,
  encryptPrivateKeyWithPassword,
} from "../../../utils/crypto";
import Card from "../ui/Card";
import Input from "../ui/Input";
import Button from "../ui/Button";
import AnimateIn from "../motion/AnimateIn";

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
      const privateKey = await exportKey(keyPair.privateKey); // stringified JWK
      const publicKey = await exportKey(keyPair.publicKey); // stringified JWK

      // Backend expects a JWK object; send only the standard members (kty, crv, x, y)
      const jwk = JSON.parse(publicKey);
      const minimalJwk = {
        kty: jwk.kty,
        crv: jwk.crv,
        x: jwk.x,
        y: jwk.y,
      };
      // Encrypt private key with user's password for server-side storage
      const epk = await encryptPrivateKeyWithPassword(privateKey, password);

      const userData = await apiRequest("auth/register/complete", "POST", {
        verificationToken,
        username: username.toLowerCase(),
        password,
        displayName,
        avatarUrl, // optional URL path if user pasted one
        publicKey: minimalJwk,
        // Compatibility alias in case backend expects a different property name
        publicKeyJwk: minimalJwk,
        encryptedPrivateKey: epk,
      });

      // Do NOT persist private key to localStorage; it will be retrieved and decrypted on login
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
          <form onSubmit={handleStep1} className="space-y-4">
            <h2 className="text-3xl font-extrabold text-center text-amber-700">
              Start Your Journey 🐝
            </h2>
            <p className="text-center text-slate-600">
              We’ll send a 6-digit code to verify it’s you.
            </p>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="you@example.com"
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Continue"}
            </Button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleStep2} className="space-y-4">
            <h2 className="text-3xl font-extrabold text-center text-amber-700">
              Verify Your Hive
            </h2>
            <p className="text-center text-slate-600">
              We sent a code to <b>{email}</b>.
            </p>
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              type="text"
              placeholder="6-digit code"
              required
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify"}
            </Button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handleStep3} className="space-y-4">
            <h2 className="text-3xl font-extrabold text-center text-amber-700">
              Join the Buzz
            </h2>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Create a unique username"
              required
              pattern="^[a-zA-Z0-9_]{3,15}$"
              title="Username must be 3-15 characters (letters, numbers, underscores)."
            />
            <div className="relative">
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                className="pr-24"
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
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              type="text"
              placeholder="Your name (display name)"
            />
            <div>
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
                Prefer a URL? Paste it below.
              </p>
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                type="url"
                placeholder="https://example.com/me.jpg"
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Finishing..." : "Finish & Login"}
            </Button>
          </form>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-gradient-to-b from-amber-100 via-yellow-50 to-amber-200">
      <div className="w-full max-w-md">
        <AnimateIn type="up" duration={0.5}>
          <Card>
            <AnimateIn type="fade" delay={0.05}>
              {renderStep()}
            </AnimateIn>
            {error && (
              <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-4 text-center">
                {error}
              </p>
            )}
            <p className="text-center mt-6 text-sm text-slate-600">
              Already have an account?{" "}
              <button
                onClick={() => setView("login")}
                className="text-amber-700 hover:underline font-semibold"
              >
                Login here
              </button>
            </p>
          </Card>
        </AnimateIn>
      </div>
    </div>
  );
};

export default RegisterFlow;
