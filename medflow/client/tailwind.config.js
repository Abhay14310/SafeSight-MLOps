/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Black Tasuke Palette ──────────────────────────
        black:    '#050505',
        surface:  '#0a0a0a',
        panel:    '#111111',
        elevated: '#161616',
        border:   '#1f1f1f',
        'border-hi': '#2a2a2a',
        muted:    '#3a3a3a',

        // Greys
        'grey-400': '#505050',
        'grey-300': '#707070',
        'grey-200': '#a0a0a0',
        'grey-100': '#d0d0d0',
        white:    '#f0f0f0',

        // Accents (neon)
        sky:     { DEFAULT: '#38BDF8', dim: '#0369a1', glow: 'rgba(56,189,248,0.3)' },
        emerald: { DEFAULT: '#10B981', dim: '#065f46', glow: 'rgba(16,185,129,0.3)' },
        amber:   { DEFAULT: '#F59E0B', dim: '#78350f', glow: 'rgba(245,158,11,0.3)' },
        rose:    { DEFAULT: '#F43F5E', dim: '#7f1d1d', glow: 'rgba(244,63,94,0.3)' },
      },
      fontFamily: {
        mono:  ['"JetBrains Mono"', 'monospace'],
        sans:  ['Poppins', 'system-ui', 'sans-serif'],
      },
      backdropBlur: { glass: '20px' },
      boxShadow: {
        'glow-sky':      '0 0 16px rgba(56,189,248,0.4), 0 0 32px rgba(56,189,248,0.15)',
        'glow-emerald':  '0 0 16px rgba(16,185,129,0.4), 0 0 32px rgba(16,185,129,0.15)',
        'glow-rose':     '0 0 16px rgba(244,63,94,0.5),   0 0 32px rgba(244,63,94,0.2)',
        'glow-amber':    '0 0 16px rgba(245,158,11,0.4), 0 0 32px rgba(245,158,11,0.15)',
        'panel':       '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.6)',
        'panel-hi':    '0 0 0 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,0,0,0.8)',
      },
      animation: {
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'blink':        'blink 1.2s ease-in-out infinite',
        'blink-fast':   'blink 0.8s ease-in-out infinite',
        'scan':         'scan 3s linear infinite',
        'float':        'float 4s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
        'slide-in-right': 'slideInRight 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-up':  'slideInUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'count-up':     'countUp 0.6s cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        blink:        { '0%,100%': { opacity:'1' }, '50%': { opacity:'0.15' } },
        scan:         { '0%': { transform:'translateY(-100%)' }, '100%': { transform:'translateY(200%)' } },
        float:        { '0%,100%': { transform:'translateY(0px)' }, '50%': { transform:'translateY(-8px)' } },
        glowPulse:    { '0%,100%': { boxShadow:'0 0 8px rgba(0,212,255,0.3)' }, '50%': { boxShadow:'0 0 24px rgba(0,212,255,0.7)' } },
        slideInRight: { from:{ opacity:'0', transform:'translateX(16px)' }, to:{ opacity:'1', transform:'translateX(0)' } },
        slideInUp:    { from:{ opacity:'0', transform:'translateY(12px)' }, to:{ opacity:'1', transform:'translateY(0)' } },
        countUp:      { from:{ opacity:'0', transform:'scale(0.92)' }, to:{ opacity:'1', transform:'scale(1)' } },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',
        'scanlines': 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.012) 2px,rgba(255,255,255,0.012) 4px)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
