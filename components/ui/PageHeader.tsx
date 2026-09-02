
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
    className = 'mb-6' 
}) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left ${className}`}>
            <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-bold text-light-text-primary dark:text-text-primary">{title}</h1>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary mt-1">{subtitle}</p>
                )}
            </div>
            {(action || children) && (
                <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    {action}
                    {children}
                </div>
            )}
        </div>
    );
};

export default PageHeader;

