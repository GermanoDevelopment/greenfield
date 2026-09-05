import React from "react";
import "./input.css";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
}

export default function Input({
  label,
  error,
  size = "md",
  className = "",
  type = "text",
  placeholder = "",
  ...props
}: InputProps) {
  const sizeClass = size ? `input-${size}` : "";
  
  return (
    <div className="input-container">
      {label && <label className="input-label">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        className={`input-field ${sizeClass} ${error ? "input-field-error" : ""} ${className}`.trim()}
        {...props}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
}
