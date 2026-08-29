import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SecondaryButton, PrimaryButton } from './Button.jsx';

export function Modal({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmLabel = 'Confirm',
  hideConfirm = false,
  hideCancel = false,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'var(--overlay)' }}
            aria-label="Close"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            className="relative w-full max-w-md rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-6"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {title && (
              <h3 className="text-lg font-display font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
            )}
            <div className="mt-3 text-sm text-[var(--text-secondary)]">{children}</div>
            <div className={hideConfirm && hideCancel ? 'mt-0' : 'mt-6 flex justify-end gap-3'}>
              {!hideCancel && <SecondaryButton onClick={onClose}>Close</SecondaryButton>}
              {onConfirm && !hideConfirm && (
                <PrimaryButton onClick={onConfirm}>{confirmLabel}</PrimaryButton>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
