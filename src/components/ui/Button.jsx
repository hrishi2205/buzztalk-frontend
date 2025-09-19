import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  icon = null,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-transform duration-150 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none";
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-base",
  };
  const variants = {
    primary:
      "brand-gradient text-white shadow-md hover:brightness-105 focus-visible:ring-2 focus-visible:ring-amber-500/40",
    secondary:
      "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-400/40",
    ghost:
      "bg-white/0 hover:bg-white/10 text-amber-700 border border-amber-200 backdrop-blur-sm",
    danger:
      "bg-gradient-to-b from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 focus-visible:ring-2 focus-visible:ring-red-500/40",
    subtle:
      "bg-amber-50/80 hover:bg-amber-100 text-amber-700 border border-amber-200 backdrop-blur-sm",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </button>
  );
};

export default Button;
