// src/components/common/Modal.tsx
import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  centered?: boolean;
  backdrop?: boolean;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  centered = true,
  backdrop = true,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <>
      {backdrop && (
        <div 
          className="modal-backdrop" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1040,
            display: 'block',
            backdropFilter: 'blur(3px)',
          }}
          onClick={onClose}
        />
      )}
      
      <div 
        className="modal d-block" 
        tabIndex={-1} 
        style={{ zIndex: 1050 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-dialog modal-${size} ${centered ? 'modal-dialog-centered' : ''} ${className}`}>
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            
            <div className="modal-body">
              {children}
            </div>
            
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;