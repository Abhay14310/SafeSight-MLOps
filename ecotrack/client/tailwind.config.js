/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── EcoTrack Brand ──────────────────────────────────
        // Green Light palette
        green: {
          50:  '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0',
          300: '#86efac', 400: '#4ade80', 500: '#22c55e',
          600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d',
        },
        // White cloud palette
        cloud: {
          50:  '#ffffff', 100: '#f8fffe', 200: '#f0fdf4',
          300: '#e8faf0', 400: '#d1fae5', 500: '#a7f3d0',
        },
        // UI greys (warm-tinted)
        slate: {
          50:'#f8fafc',100:'#f1f5f9',200:'#e2e8f0',300:'#cbd5e1',
          400:'#94a3b8',500:'#64748b',600:'#475569',700:'#334155',
          800:'#1e293b',900:'#0f172a',
        },
        // Accent
        emerald: { DEFAULT:'#10b981', light:'#d1fae5', dark:'#065f46' },
        teal:    { DEFAULT:'#0d9488', light:'#ccfbf1' },
        lime:    { DEFAULT:'#84cc16', light:'#ecfccb' },
        warn:    '#f59e0b',
        danger:  '#ef4444',
      },
      fontFamily: {
        mono: ['"Space Mono"','Courier New','monospace'],
        sans: ['Inter','system-ui','sans-serif'],
      },
      fontSize: {
        // Medium size as specified
        'display': ['2rem',   { lineHeight:'1.2', fontWeight:'700' }],
        'heading': ['1.5rem', { lineHeight:'1.3', fontWeight:'600' }],
        'title':   ['1.125rem',{ lineHeight:'1.4', fontWeight:'600' }],
        'body':    ['0.9375rem',{ lineHeight:'1.6', fontWeight:'400' }],  // 15px medium
        'small':   ['0.8125rem',{ lineHeight:'1.5', fontWeight:'400' }],  // 13px
        'xs-mono': ['0.75rem', { lineHeight:'1.4', fontWeight:'400', fontFamily:'"Space Mono"' }],
      },
      backgroundImage: {
        'eco-gradient': 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)',
        'hero-gradient':'linear-gradient(180deg, #052e16 0%, #14532d 40%, #166534 70%, #15803d 100%)',
        'card-shimmer': 'linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)',
      },
      boxShadow: {
        'card':     '0 2px 8px rgba(22,163,74,0.08), 0 1px 3px rgba(0,0,0,0.04)',
        'card-lg':  '0 8px 24px rgba(22,163,74,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'green':    '0 4px 14px rgba(34,197,94,0.4)',
        'glow':     '0 0 20px rgba(34,197,94,0.35)',
        'inner':    'inset 0 1px 4px rgba(22,163,74,0.1)',
      },
      borderRadius: { xl:'12px', '2xl':'16px', '3xl':'24px', '4xl':'32px' },
      animation: {
        'fade-up':     'fadeUp .45s cubic-bezier(0.16,1,0.3,1)',
        'slide-left':  'slideLeft .4s cubic-bezier(0.16,1,0.3,1)',
        'float':       'float 4s ease-in-out infinite',
        'pulse-green': 'pulseGreen 2s ease-in-out infinite',
        'spin-slow':   'spin 8s linear infinite',
        'leaf-fall':   'leafFall 6s ease-in-out infinite',
        'count':       'countUp .6s cubic-bezier(0.16,1,0.3,1)',
        'shimmer':     'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp:     { from:{opacity:'0',transform:'translateY(14px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        slideLeft:  { from:{opacity:'0',transform:'translateX(-14px)'},to:{opacity:'1',transform:'translateX(0)'} },
        float:      { '0%,100%':{transform:'translateY(0)'}, '50%':{transform:'translateY(-8px)'} },
        pulseGreen: { '0%,100%':{boxShadow:'0 0 0 0 rgba(34,197,94,0.4)'}, '50%':{boxShadow:'0 0 0 10px rgba(34,197,94,0)'} },
        leafFall:   { '0%':{transform:'rotate(0deg) translateY(0)'}, '50%':{transform:'rotate(15deg) translateY(-6px)'}, '100%':{transform:'rotate(0deg) translateY(0)'} },
        countUp:    { from:{opacity:'0',transform:'scale(.9) translateY(6px)'}, to:{opacity:'1',transform:'scale(1) translateY(0)'} },
        shimmer:    { '0%':{backgroundPosition:'-200px 0'}, '100%':{backgroundPosition:'calc(200px + 100%) 0'} },
      },
    },
  },
  plugins: [],
};
