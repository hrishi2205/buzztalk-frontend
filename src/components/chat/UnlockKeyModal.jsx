import React, { useState } from "react";
import { decryptPrivateKeyWithPassword } from "../../../utils/crypto";

const UnlockKeyModal = ({ currentUser, onUnlocked, onClose, onAlert }) => {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const handleUnlock = async (e) => {
    e?.preventDefault?.();
    if (!currentUser?.encryptedPrivateKey) return;
    setBusy(true);
    try {
      const priv = await decryptPrivateKeyWithPassword(
        currentUser.encryptedPrivateKey,
        password
      );
      const updated = { ...currentUser, __privateKey: priv };
      onUnlocked?.(updated);
      onAlert?.("Encryption key unlocked.", "success");
      onClose?.();
    } catch (e) {
      onAlert?.(
        "Couldn't unlock your key. Check password and try again.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-200 shadow-xl">
        <div className="p-4 border-b border-amber-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-700">Unlock Messages</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-200"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleUnlock} className="p-4 space-y-3">
          <p className="text-sm text-slate-700">
            Enter your account password to unlock your encrypted private key so
            we can decrypt messages on this device.
          </p>
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/70 text-slate-800 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
              placeholder="Account password"
              autoFocus
              required
            />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-4 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
            >
              {busy ? "Unlocking..." : "Unlock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnlockKeyModal;
