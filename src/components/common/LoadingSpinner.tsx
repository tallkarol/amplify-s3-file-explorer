// src/components/common/LoadingSpinner.tsx
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    centered?: boolean;
    text?: string;
  }
  
  const LoadingSpinner = ({ 
    size = 'md', 
    centered = true, 
    text = 'Loading...' 
  }: LoadingSpinnerProps) => {
    
    const sizeClass = {
      sm: 'spinner-border-sm',
      md: '',
      lg: 'spinner-border fs-4'
    }[size];
    
    const spinner = (
      <div className={`spinner-border text-primary ${sizeClass}`} role="status">
        <span className="visually-hidden">{text}</span>
      </div>
    );
    
    if (centered) {
      return (
        <div className="text-center p-4">
          {spinner}
          {text && <p className="mt-2 text-muted">{text}</p>}
        </div>
      );
    }
    
    return spinner;
  };
  
  export default LoadingSpinner;