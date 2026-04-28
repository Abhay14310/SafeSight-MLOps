// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[EcoTrack] Uncaught error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
            <div style={{ color: '#166534', fontWeight: 'bold', marginBottom: '0.5rem' }}>Something went wrong</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>{this.state.error.message}</div>
            <button onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
              style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem', cursor: 'pointer' }}>
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// NOTE: StrictMode removed — it double-invokes effects which breaks GSAP animations
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ErrorBoundary>
);
