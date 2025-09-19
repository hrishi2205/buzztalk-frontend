import React from "react";

const Button = ({
  children,
  variant = "primary",
  className = "",
  disabled,
  ...props
}) => {
  const base =
    "px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-amber-500 hover:bg-amber-600 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50",
    secondary:
      "bg-slate-800 hover:bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-slate-500/50",
    ghost:
      "bg-transparent hover:bg-amber-50 text-amber-700 border border-amber-300",
    danger:
      "bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50",
    subtle:
      "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300",
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
