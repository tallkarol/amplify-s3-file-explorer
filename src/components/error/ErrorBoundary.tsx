// src/components/error/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';
import { logError } from '../../services/logService';

interface Props {
  children: ReactNode;
  component?: string;
  userId?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logError(
      error,
      'Boundary',
      this.props.component || 'ErrorBoundary',
      this.props.userId
    );
    
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="alert alert-danger m-3">
          <h4 className="alert-heading">Something went wrong</h4>
          <p>An error occurred in this component. The development team has been notified.</p>
          <hr />
          <p className="mb-0">
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={() => window.location.reload()}
            >
              <i className="bi bi-arrow-clockwise me-1"></i>
              Reload Page
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;