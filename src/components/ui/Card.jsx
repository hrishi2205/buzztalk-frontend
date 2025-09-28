import React from "react";

const Card = ({ className = "", children }) => {
  return (
    <div
      className={`p-6 md:p-8 glass-card transition-all duration-200 hover:shadow-lg ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
