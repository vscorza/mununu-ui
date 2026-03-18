import { ReactNode, useEffect } from "react";
import { Button } from "./Button";
import "./Modal.css";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = `modal-content-${size}`;

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="modal-container">
        <div className="modal-backdrop" aria-hidden="true" />

        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>

        <div
          className={`modal-content ${sizeClass}`}
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="modal-header">
              <h3 id="modal-title" className="modal-title">
                {title}
              </h3>
            </div>
          )}

          <div className="modal-body">{children}</div>

          {footer !== undefined && (
            <div className="modal-footer">
              {footer || (
                <Button variant="secondary" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
