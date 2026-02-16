import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse'
}) => {
  const baseClasses = 'bg-neutral-200 dark:bg-neutral-700';

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-pulse', // Can be enhanced with wave animation
    none: ''
  };

  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      role="presentation"
      aria-hidden="true"
    />
  );
};

// Specific skeleton components for common use cases
export const TextSkeleton: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? '60%' : '100%'}
        height={16}
      />
    ))}
  </div>
);

export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border border-neutral-200 rounded-lg ${className}`}>
    <div className="space-y-3">
      <Skeleton variant="text" width="60%" height={20} />
      <TextSkeleton lines={2} />
      <div className="flex space-x-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  </div>
);

export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({
  fields = 3,
  className = ''
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <Skeleton variant="text" width="30%" height={14} />
        <Skeleton variant="rectangular" width="100%" height={40} />
      </div>
    ))}
    <div className="flex space-x-2 pt-4">
      <Skeleton variant="rectangular" width={100} height={40} />
      <Skeleton variant="rectangular" width={100} height={40} />
    </div>
  </div>
);

export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {/* Table header */}
    <div className="flex space-x-4">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width="100%" height={16} />
      ))}
    </div>
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton
            key={colIndex}
            variant="text"
            width="100%"
            height={14}
          />
        ))}
      </div>
    ))}
  </div>
);

export const AvatarSkeleton: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = ''
}) => (
  <Skeleton
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
);

export const ButtonSkeleton: React.FC<{ width?: string | number; className?: string }> = ({
  width = 100,
  className = ''
}) => (
  <Skeleton
    variant="rectangular"
    width={width}
    height={40}
    className={`rounded ${className}`}
  />
);