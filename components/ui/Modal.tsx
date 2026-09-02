import React, { ReactNode } from 'react';
import { HiXMark } from 'react-icons/hi2';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-light-surface dark:bg-surface rounded-2xl shadow-2xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] flex flex-col border border-slate-200 dark:border-zinc-700 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
          <h2 className="text-lg sm:text-xl font-bold text-light-text-primary dark:text-text-primary truncate pr-2">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Close modal"
          >
            <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pr-0.5 -mr-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;