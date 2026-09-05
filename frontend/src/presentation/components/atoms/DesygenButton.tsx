import React from 'react';
import Button, { type ButtonProps } from '../../../../components/ui/Button';

export interface DesygenButtonProps extends ButtonProps {
  icon?: React.ReactNode;
  isLoading?: boolean;
}

export const DesygenButton: React.FC<DesygenButtonProps> = ({
  children,
  icon,
  isLoading,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <Button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon
      )}
      {children}
    </Button>
  );
};

export default DesygenButton;
