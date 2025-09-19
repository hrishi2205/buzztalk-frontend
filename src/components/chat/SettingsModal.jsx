import React, { useState } from "react";
import { apiRequest, uploadAvatarFile } from "../../../utils/api";

const SettingsModal = ({ currentUser, onClose, onUpdated, onAlert }) => {
  const [displayName, setDisplayName] = useState(
    currentUser.displayName || currentUser.username
  );
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let newAvatarUrl = avatarUrl;
      // If a new file is chosen, upload it first
      if (avatarFile) {
        const { url } = await uploadAvatarFile(avatarFile, currentUser.token);
        newAvatarUrl = url;
      }
      const updated = await apiRequest(
        "users/profile",
        "PATCH",
        { displayName, avatarUrl: newAvatarUrl },
        currentUser.token
      );
      // Merge into local currentUser shape
      const merged = {
        ...currentUser,
        displayName: updated.displayName || displayName,
        avatarUrl: updated.avatarUrl ?? newAvatarUrl,
      };
      localStorage.setItem("currentUser", JSON.stringify(merged));
      onUpdated(merged);
      onAlert("Profile updated.", "success");
      onClose();
    } catch (err) {
      onAlert(err.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
      <div className="w-full max-w-md mx-4 rounded-2xl bg-white/90 backdrop-blur-md border border-amber-200 shadow-xl">
        <div className="p-4 border-b border-amber-200 flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-700">Settings</h3>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-amber-100 text-amber-700 border border-amber-200"
          >
            Close
          </button>
        </div>
        <form onSubmit={handleSave} className="p-4 space-y-3">
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Display name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              type="text"
              className="w-full px-3 py-2 rounded-xl bg-white/70 text-slate-800 border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400"
              placeholder="Name shown to others"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-700 mb-1">Avatar</label>
            <div className="flex items-center gap-3">
              {avatarFile ? (
                <img
                  src={URL.createObjectURL(avatarFile)}
                  alt="preview"
                  className="w-12 h-12 rounded-full object-cover border"
                />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="current"
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
              Choose an image to upload. If left empty, your existing avatar (if
              any) will remain.
            </p>
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
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-gradient-to-b from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
