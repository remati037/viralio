'use client';

import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

/** Input classes for use inside modal (light theme) */
export const modalInputClass =
  'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400';

/** Cancel/secondary button classes for modal */
export const modalCancelButtonClass =
  'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900';

/** Primary button classes for modal (grey solid) */
export const modalPrimaryButtonClass = 'bg-primary hover:bg- text-white';

/** Textarea classes for use inside modal */
export const modalTextareaClass =
  'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-400 min-h-[80px]';

import { createPortal } from 'react-dom';
import { Button } from './button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Max width: 'sm' (28rem), 'md' (32rem), 'lg' (36rem), 'xl' (42rem), '2xl' (48rem), '4xl' (56rem) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  className?: string;
  /** Don't close on overlay click */
  preventCloseOnOverlay?: boolean;
  /** Disable close button and overlay close (e.g. during loading) */
  disableClose?: boolean;
  /** No header - just the white container; parent renders full content */
  bare?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
};

/**
 * Modal wrapper following the app style guide:
 * - White modal on dark overlay
 * - Soft shadow, rounded corners
 * - Title, optional description, close X
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  className,
  preventCloseOnOverlay = false,
  disableClose = false,
  bare = false,
}: ModalProps) {
  if (!isOpen) return null;

  const showHeader = !bare && (title || description || !disableClose);

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
      onClick={
        preventCloseOnOverlay ? undefined : () => !disableClose && onClose()
      }
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-white rounded-xl shadow-xl border border-slate-200',
          maxWidthClasses[maxWidth],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="flex justify-between items-start p-6 pb-4">
            <div>
              {title != null && (
                <h2 className="text-lg font-semibold text-slate-900">
                  {title}
                </h2>
              )}
              {description != null && (
                <p className="text-sm text-slate-500 mt-1">{description}</p>
              )}
            </div>
            {!disableClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="shrink-0 -mr-2 -mt-1 text-slate-400 hover:text-slate-600"
                aria-label="Zatvori"
              >
                <X size={20} />
              </Button>
            )}
          </div>
        )}
        <div
          className={`overflow-y-auto ${cn(showHeader ? 'p-6 pt-0' : 'p-6')}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}
