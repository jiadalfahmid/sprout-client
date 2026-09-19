import React, { ReactNode, useEffect, useRef } from 'react';
import { HiXMark } from 'react-icons/hi2';
import SectionHeading from './SectionHeading';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg sm:max-w-xl',
  xl: 'max-w-xl sm:max-w-2xl',
};

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  size = 'md',
  className = '',
}) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const hasInitialFocusRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasInitialFocusRef.current = false;
      return;
    }

    document.body.classList.add('modal-open');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    previousActiveElementRef.current = document.activeElement as HTMLElement | null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Only set initial focus once upon opening the modal
    let timer: NodeJS.Timeout | null = null;
    if (!hasInitialFocusRef.current) {
      hasInitialFocusRef.current = true;
      timer = setTimeout(() => {
        if (!modalRef.current) return;
        // Never steal focus if an element inside the modal is already focused
        if (modalRef.current.contains(document.activeElement)) {
          return;
        }

        // Prefer focusing the first form input/textarea/select so the user can type immediately
        const formInput = modalRef.current.querySelector<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
        );
        if (formInput) {
          formInput.focus();
          return;
        }

        // Otherwise fallback to first non-close focusable element, or the close button
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const nonCloseElement = Array.from(focusable).find(el => el !== closeButtonRef.current);
        if (nonCloseElement) {
          nonCloseElement.focus();
        } else {
          closeButtonRef.current?.focus();
        }
      }, 50);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
      const remainingDialogs = document.querySelectorAll('[role="dialog"]');
      if (remainingDialogs.length <= 1) {
        document.body.classList.remove('modal-open');
        document.body.style.overflow = originalOverflow;
      }
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  return (
    <div
      className="fixed inset-0 bg-black/75 sm:bg-black/80 backdrop-blur-xs z-[100] flex justify-center items-center p-2.5 sm:p-4 overflow-y-auto no-scrollbar"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`bg-light-surface dark:bg-surface rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 w-full ${sizeClass} max-h-[calc(100dvh-1.5rem)] sm:max-h-[88vh] flex flex-col border border-slate-200 dark:border-zinc-700 my-auto no-scrollbar ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3 sm:mb-4 shrink-0">
          <SectionHeading className="truncate pr-2 text-base sm:text-lg">
            {title}
          </SectionHeading>
          <button 
            ref={closeButtonRef}
            onClick={onClose} 
            className="p-1.5 rounded-xl text-light-text-secondary dark:text-text-secondary hover:text-light-text-primary dark:hover:text-text-primary hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Close modal"
          >
            <HiXMark className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <div className="overflow-y-auto no-scrollbar modal-scroll-area flex-1 overscroll-contain pb-2 pr-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;