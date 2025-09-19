import React from "react";

const Input = ({ className = "", ...props }) => {
  const base =
    "w-full px-4 py-3 rounded-xl bg-white/70 text-slate-800 placeholder:text-slate-400 border border-amber-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 backdrop-blur-sm";
  return <input className={`${base} ${className}`} {...props} />;
};

export default Input;
