import React, { ReactNode } from 'react';

export const SECTION_HEADING_CLASS = 'text-base sm:text-lg font-bold text-light-text-primary dark:text-text-primary';

export interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
  subtitle?: ReactNode;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  children,
  className = '',
  action,
  subtitle,
}) => {
  if (!action && !subtitle) {
    return (
      <h2 className={`${SECTION_HEADING_CLASS} ${className}`}>
        {children}
      </h2>
    );
  }

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      <div>
        <h2 className={SECTION_HEADING_CLASS}>
          {children}
        </h2>
        {subtitle && (
          <p className="text-xs text-light-text-secondary dark:text-text-secondary mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export default SectionHeading;
