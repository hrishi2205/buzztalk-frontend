import React from "react";

const Input = ({ className = "", size = "md", ...props }) => {
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-sm",
    lg: "px-5 py-3.5 text-base",
  };
  const base =
    "w-full rounded-xl bg-white/80 text-slate-800 placeholder:text-slate-400 border border-amber-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 backdrop-blur-sm transition-all duration-200 hover:bg-white/90";
  return <input className={`${base} ${sizes[size]} ${className}`} {...props} />;
};

export default Input;
