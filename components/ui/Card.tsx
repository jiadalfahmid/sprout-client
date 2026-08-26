import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
}

// FIX: Wrapped component in React.forwardRef to allow passing a ref to the underlying motion.div
const Card = React.forwardRef<HTMLDivElement, CardProps>(({ children, className = '' }, ref) => {
  return (
    <motion.div 
      ref={ref}
      className={`bg-light-surface dark:bg-surface rounded-2xl shadow-lg p-6 border border-slate-200 dark:border-zinc-700/50 ${className}`}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;
