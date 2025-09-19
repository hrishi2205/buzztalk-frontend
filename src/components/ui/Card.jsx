import React from "react";

const Card = ({ className = "", children }) => {
  return (
    <div
      className={`bg-white p-6 md:p-8 rounded-2xl shadow-2xl border border-amber-200 ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
