import React from "react";

const Card = ({ className = "", children }) => {
  return (
    <div
      className={`p-6 md:p-8 rounded-2xl border bg-white/70 backdrop-blur-md border-amber-200 shadow-[0_8px_30px_rgb(0,0,0,0.05)] ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
