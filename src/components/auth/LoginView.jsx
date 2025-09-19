import React, { useState } from "react";
import toast from "react-hot-toast";
import { apiRequest } from "../../../utils/api";
import { generateKeyPair, exportKey } from "../../../utils/crypto";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

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
      if (username) {
        const storageKey = `privateKey_${username}`;
        let storedPriv = localStorage.getItem(storageKey);

        const providedPrivateKey =
          userData.privateKey ||
          userData.encryptionKey ||
          userData.clientPrivateKey;
        if (!storedPriv && providedPrivateKey) {
          localStorage.setItem(storageKey, providedPrivateKey);
          storedPriv = providedPrivateKey;
          console.log(`Stored provided private key for user: ${username}`);
        }

        if (!storedPriv && userData.token) {
          try {
            console.info(
              "No local private key found — generating a new key pair and rotating public key..."
            );
            const keyPair = await generateKeyPair();
            const privateKeyStr = await exportKey(keyPair.privateKey);
            const publicKeyStr = await exportKey(keyPair.publicKey);
            const jwk = JSON.parse(publicKeyStr);
            const minimalJwk = {
              kty: jwk.kty,
              crv: jwk.crv,
              x: jwk.x,
              y: jwk.y,
            };

            await apiRequest(
              "users/public-key",
              "POST",
              { publicKey: minimalJwk },
              userData.token
            );

            localStorage.setItem(storageKey, privateKeyStr);
            console.info(
              "Client keys restored and public key rotated successfully."
            );
          } catch (keyErr) {
            console.error("Failed to restore/generate client keys:", keyErr);
            toast.error(
              "Logged in, but couldn't restore encryption keys. You may not be able to read old messages until keys are restored."
            );
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
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-amber-50 via-yellow-100 to-amber-200">
      <div className="relative w-full max-w-md">
        <Card>
          {/* Bee Logo */}
          <div className="flex justify-center mb-6">
            <div className="h-16 w-16 flex items-center justify-center rounded-full brand-gradient shadow-md">
              <span className="text-3xl text-white">🐝</span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-extrabold text-center text-amber-700 mb-2">
            Buzz In to Buzztalk
          </h2>
          <p className="text-center text-slate-600 mb-8">
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
                className="pr-24"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute inset-y-0 right-0 px-3 m-1 rounded-lg text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-sm font-medium"
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
      </div>
    </div>
  );
};

export default LoginView;
