import React from 'react';
import { cn } from '../../lib/utils';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible label describing the button action (required). */
  'aria-label': string;
  /** Optional visual title shown on hover. */
  title?: string;
  /** Size variant. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether the button is in a loading/pending state. */
  isLoading?: boolean;
}

/**
 * Accessible icon button wrapper.
 * Requires an aria-label so screen readers can announce the action.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const sizeClasses = {
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
    };

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-100',
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="sr-only">Loading</span>
        ) : null}
        {children}
      </button>
    );
  }
);
IconButton.displayName = 'IconButton';
