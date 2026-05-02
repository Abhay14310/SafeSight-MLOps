// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-6 font-mono">
          <div className="w-16 h-16 bg-red/10 border border-red/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="text-red" size={32} />
          </div>
          <h1 className="text-xl font-bold mb-2 tracking-tight">SYSTEM ANOMALY DETECTED</h1>
          <p className="text-grey-400 text-sm mb-8 text-center max-w-md">
            The MedFlow kernel encountered an unrecoverable rendering error. Diagnostic logs have been recorded.
          </p>
          <div className="bg-grey-900 border border-white/5 p-4 rounded-md mb-8 w-full max-w-xl overflow-x-auto">
            <code className="text-red-400 text-xs">
              {this.state.error?.toString()}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan text-black font-bold text-xs rounded-sm hover:bg-cyan-light transition-all"
          >
            <RefreshCcw size={14} />
            REBOOT SYSTEM
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
