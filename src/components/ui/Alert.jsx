import React, { useEffect } from "react";

const Alert = ({ message, type = "success", onClose }) => {
  // Set a timer to automatically close the alert after 4 seconds
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    // Cleanup: clear the timer if the component unmounts
    return () => clearTimeout(timer);
  }, [onClose]);

  // Determine the background color based on the alert type
  const bgColor = type === "error" ? "bg-red-600" : "bg-green-600";

  return (
    <div
      className={`fixed top-5 right-5 p-4 rounded-md shadow-lg text-white ${bgColor} z-50 animate-fade-in-down`}
    >
      {message}
    </div>
  );
};

export default Alert;
