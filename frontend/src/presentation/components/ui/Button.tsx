import React from "react";
import "./button.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost";
}

export default function Button({
  children,
  size = "md",
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const sizeClass = size ? `btn-${size}` : "";
  const variantClass = variant ? `btn-${variant}` : "";
  
  return (
    <button 
      className={`btn ${sizeClass} ${variantClass} ${className}`.trim()} 
      {...props}
    >
      {children}
    </button>
  );
}
