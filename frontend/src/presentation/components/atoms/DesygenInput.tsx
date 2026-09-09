import React from 'react';
import Input, { type InputProps } from '../ui/Input';

export interface DesygenInputProps extends InputProps {
  helperText?: string;
}

export const DesygenInput: React.FC<DesygenInputProps> = ({
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <Input className={`w-full ${className}`} {...props} />
      {helperText && !props.error && (
        <span className="text-xs text-slate-400 mt-1 block">{helperText}</span>
      )}
    </div>
  );
};

export default DesygenInput;
