import React, { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../../utils/api";
import {
  generateKeyPair,
  exportKey,
  decryptPrivateKeyWithPassword,
} from "../../utils/crypto";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";
import AnimateIn from "../motion/AnimateIn";

const LoginView = ({ setView, onLoginSuccess }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

      console.log("Login response userData:", userData);

      const username = userData.username;
      // Decrypt the server-stored encrypted private key using the password
      if (userData.encryptedPrivateKey) {
        try {
          const privateKeyStr = await decryptPrivateKeyWithPassword(
            userData.encryptedPrivateKey,
            password
          );
          // attach ephemeral private key to userData for runtime use (not persisted to localStorage)
          userData.__privateKey = privateKeyStr;
        } catch (e) {
          console.error("Failed to decrypt server-stored private key:", e);
          // Migration fallback: if old localStorage key exists, keep using it
          if (username) {
            const storageKey = `privateKey_${username}`;
            const storedPriv = localStorage.getItem(storageKey);
            if (storedPriv) {
              userData.__privateKey = storedPriv;
              toast(
                "Using locally stored key. Consider re-saving your key to server."
              );
            } else {
              toast.error(
                "Couldn't unlock your encryption key. Please double-check your password.",
                { duration: 4000 }
              );
            }
          }
        }
      } else if (username) {
        // If backend has no EPK yet, migrate from localStorage if present
        const storageKey = `privateKey_${username}`;
        const storedPriv = localStorage.getItem(storageKey);
        if (storedPriv && userData.token) {
          try {
            // Use current password to create EPK and upload
            const epk = await (
              await import("../../utils/crypto")
            ).encryptPrivateKeyWithPassword(storedPriv, password);
            await apiRequest("users/private-key", "POST", epk, userData.token);
            userData.__privateKey = storedPriv;
            toast.success("Encrypted key saved to your account.");
          } catch (e) {
            console.warn("Failed to upload encrypted key:", e.message);
            userData.__privateKey = storedPriv;
          }
        }
      }

      onLoginSuccess(userData);
      toast.success("Logged in — welcome back! 🐝", {
        icon: "✨",
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:px-4 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200">
      <div className="relative w-full max-w-sm sm:max-w-md">
        <AnimateIn type="up" duration={0.5}>
          <Card>
            {/* Bee Logo */}
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 flex items-center justify-center rounded-full brand-gradient shadow-md">
                <span className="text-3xl text-white">🐝</span>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-slate-800 mb-2">
              Buzz In to Buzztalk
            </h2>
            <p className="text-center text-orange-600 mb-6 sm:mb-8 text-sm sm:text-base">
              Welcome back to your hive
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                type="text"
                placeholder="Email or Username"
                required
              />

              <div className="relative">
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="pr-16 sm:pr-20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 px-2 sm:px-3 m-1 rounded-lg text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs sm:text-sm font-medium"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Buzzing in..." : "Login"}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center mt-8 text-sm text-slate-600">
              No hive yet?{" "}
              <button
                onClick={() => setView("register")}
                className="text-amber-700 hover:underline font-semibold"
              >
                Register now
              </button>
            </p>
          </Card>
        </AnimateIn>
      </div>
    </div>
  );
};

export default LoginView;
