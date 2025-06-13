import React from 'react';
import { cn } from '@/lib/utils';

interface SelectNativeProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

export const SelectNative = React.forwardRef<HTMLSelectElement, SelectNativeProps>(
  ({ className, children, onChange, onValueChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <select
        ref={ref}
        onChange={handleChange}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    );
  }
);

SelectNative.displayName = 'SelectNative';
