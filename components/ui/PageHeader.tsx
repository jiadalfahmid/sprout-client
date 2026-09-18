
import React from 'react';

interface PageHeaderProps {
    title: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
    title, 
    subtitle, 
    action, 
    children, 
    className = 'mb-4 sm:mb-6' 
}) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 text-left ${className}`}>
            <div className="min-w-0 flex-1 text-left">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-light-text-primary dark:text-text-primary tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary mt-0.5 sm:mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            {(action || children) && (
                <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-center shrink-0 flex-wrap sm:flex-nowrap">
                    {action}
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;

