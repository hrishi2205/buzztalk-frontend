import React from "react";

const Card = ({ className = "", children }) => {
  return <div className={`p-6 md:p-8 glass-card ${className}`}>{children}</div>;
};

export default Card;
