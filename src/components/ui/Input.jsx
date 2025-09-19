import React from "react";

const Input = ({ className = "", ...props }) => {
  const base =
    "w-full p-3 bg-amber-50 rounded-md text-slate-800 border border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500";
  return <input className={`${base} ${className}`} {...props} />;
};

export default Input;
