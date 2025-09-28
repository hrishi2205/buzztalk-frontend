import React from "react";

const LoadingScreen = ({ message = "Loading your hive…" }) => {
  return (
    <div className="h-screen w-screen relative overflow-hidden text-slate-900">
      <div className="absolute inset-0 -z-10 bg-soft-honey" />
      <div className="absolute inset-0 -z-10 opacity-50 bg-dot-grid" />

      <div className="h-full w-full flex flex-col items-center justify-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-400/80 [clip-path:polygon(25%_6.7%,75%_6.7%,100%_50%,75%_93.3%,25%_93.3%,0_50%)] shadow-[0_8px_30px_rgba(0,0,0,0.06)]" />
          <h1 className="text-2xl font-extrabold text-amber-700">BuzzTalk</h1>
        </div>
        <div className="flex items-center gap-3 text-slate-700">
          <svg
            className="w-6 h-6 animate-spin text-amber-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-80"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
