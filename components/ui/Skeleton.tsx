import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse ${className}`}
    />
  );
};

export default Skeleton;