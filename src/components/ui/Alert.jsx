import React, { useEffect } from "react";

const Alert = ({ message, type = "success", onClose }) => {
  // Set a timer to automatically close the alert after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    // Cleanup: clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine the background color based on the alert type
  const styles =
    type === "error"
      ? "bg-red-500/90 border-red-400"
      : "bg-emerald-500/90 border-emerald-400";

  return (
    <div
      className={`fixed top-5 right-5 px-4 py-3 rounded-xl shadow-lg text-white border backdrop-blur-md ${styles} z-50 transition-all animate-fade-in-down`}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-white/80"></span>
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Alert;
