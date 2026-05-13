'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';
import { Check } from 'lucide-react';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, className, disabled }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          'h-4 w-4 shrink-0 rounded-sm border border-input ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors',
          checked ? 'bg-primary border-primary text-primary-foreground' : 'bg-background',
          className,
        )}
      >
        {checked && <Check className="h-3 w-3 stroke-[3]" />}
      </button>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
