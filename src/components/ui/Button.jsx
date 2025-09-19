import React from "react";

const Button = ({
  children,
  variant = "primary",
  className = "",
  disabled = false,
  ...props
}) => {
  const base =
    "px-3 py-1.5 rounded-md text-sm font-medium transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-gradient-to-b from-amber-400 to-amber-600 text-white hover:from-amber-500 hover:to-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40",
    secondary:
      "bg-gradient-to-b from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500/40",
    ghost:
      "bg-white/0 hover:bg-white/10 text-amber-700 border border-amber-200 backdrop-blur-sm",
    danger:
      "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/40",
    subtle:
      "bg-amber-50/80 hover:bg-amber-100 text-amber-700 border border-amber-200 backdrop-blur-sm",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
