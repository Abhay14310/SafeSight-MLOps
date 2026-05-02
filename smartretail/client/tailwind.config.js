/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── SmartRetail Brand ──────────────────────────────
        bg:       '#edf1f5',
        'bg-dark':'#e2e8f0',
        surface:  '#ffffff',
        'surface-2': '#f8fafc',
        navy:    { DEFAULT:'#0145f2', dark:'#0138c8', light:'#3369f5', xlight:'#e8eeff' },
        // Status
        success: '#16a34a', warn: '#d97706', danger: '#dc2626',
        // Greys
        'grey-900':'#0f172a','grey-700':'#334155','grey-500':'#64748b',
        'grey-300':'#cbd5e1','grey-100':'#f1f5f9',
        // Accents (using defaults)
      },
      fontFamily: {
        mono: ['"Space Mono"','Courier New','monospace'],
        sans: ['Inter','system-ui','sans-serif'],
      },
      boxShadow: {
        'card':  '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(1,69,242,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'navy':  '0 4px 14px rgba(1,69,242,0.35)',
        'inner': 'inset 0 1px 3px rgba(0,0,0,0.06)',
      },
      borderRadius: { xl:'12px', '2xl':'16px', '3xl':'24px' },
      animation: {
        'slide-in': 'slideIn 0.35s cubic-bezier(0.16,1,0.3,1)',
        'fade-up':  'fadeUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'pulse-navy':'pulseNavy 2s ease-in-out infinite',
        'count-up': 'countUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'ticker':   'ticker 0.3s ease',
      },
      keyframes: {
        slideIn:    { from:{opacity:'0',transform:'translateX(-12px)'}, to:{opacity:'1',transform:'translateX(0)'} },
        fadeUp:     { from:{opacity:'0',transform:'translateY(10px)'},  to:{opacity:'1',transform:'translateY(0)'} },
        pulseNavy:  { '0%,100%':{boxShadow:'0 0 0 0 rgba(1,69,242,0.4)'}, '50%':{boxShadow:'0 0 0 8px rgba(1,69,242,0)'} },
        countUp:    { from:{opacity:'0',transform:'scale(0.9) translateY(6px)'}, to:{opacity:'1',transform:'scale(1) translateY(0)'} },
        ticker:     { from:{opacity:'0',transform:'translateY(-6px)'}, to:{opacity:'1',transform:'translateY(0)'} },
      },
    },
  },
  plugins: [],
};
