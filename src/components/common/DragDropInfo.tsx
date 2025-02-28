// src/components/common/DragDropInfo.tsx
import { useState } from 'react';

interface DragDropInfoProps {
  isDisabled?: boolean; // Whether drag & drop is disabled in the current context
}

const DragDropInfo = ({ isDisabled = false }: DragDropInfoProps) => {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Don't show if disabled or already dismissed
  if (isDisabled || isDismissed) return null;
  
  return (
    <div className="alert alert-info alert-dismissible fade show d-flex align-items-center mt-3" role="alert">
      <div className="flex-shrink-0 me-3">
        <i className="bi bi-info-circle fs-4"></i>
      </div>
      <div className="flex-grow-1">
        <h6 className="alert-heading mb-1">Quick Tip: Drag & Drop Enabled</h6>
        <p className="mb-0">
          You can now drag files directly from your computer and drop them here to upload.
        </p>
      </div>
      <button 
        type="button" 
        className="btn-close" 
        onClick={() => setIsDismissed(true)}
        aria-label="Close"
      ></button>
    </div>
  );
};

export default DragDropInfo;