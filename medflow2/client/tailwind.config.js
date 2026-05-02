/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── MedFlow2 Design System (from image) ───────────────
        navy:    { DEFAULT:'#0A1C40', 50:'#0d2354', 100:'#0A1C40', 200:'#071530', 300:'#050e20' },
        green:   { DEFAULT:'#71E07E', dark:'#4cc45c', light:'rgba(113,224,126,0.15)', xlight:'rgba(113,224,126,0.08)' },
        purple:  { DEFAULT:'#6200D9', light:'rgba(98,0,217,0.2)', xlight:'rgba(98,0,217,0.1)' },
        violet:  { DEFAULT:'#BA5FFF', light:'rgba(186,95,255,0.2)', xlight:'rgba(186,95,255,0.08)' },
        white:   '#FFFFFF',
        // Surface layers
        s1:  '#0A1C40',
        s2:  '#0f2450',
        s3:  '#132d60',
        s4:  '#162f6a',
        // Semantic
        warn:    '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
        muted:   'rgba(255,255,255,0.4)',
        border:  'rgba(113,224,126,0.15)',
        border2: 'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        sans:  ['Outfit','system-ui','sans-serif'],
        mono:  ['"Space Mono"','Courier New','monospace'],
      },
      fontSize: {
        'xs2':  ['0.625rem',{ lineHeight:'1' }],
        'xs':   ['0.75rem', { lineHeight:'1.3' }],
        'sm':   ['0.875rem',{ lineHeight:'1.45' }],
        'base': ['1rem',    { lineHeight:'1.5' }],
        'lg':   ['1.125rem',{ lineHeight:'1.4' }],
        'xl':   ['1.25rem', { lineHeight:'1.3' }],
        '2xl':  ['1.5rem',  { lineHeight:'1.2' }],
        '3xl':  ['1.875rem',{ lineHeight:'1.15' }],
        '4xl':  ['2.25rem', { lineHeight:'1.1' }],
      },
      boxShadow: {
        'glow-green':  '0 0 20px rgba(113,224,126,0.35), 0 0 40px rgba(113,224,126,0.15)',
        'glow-purple': '0 0 20px rgba(98,0,217,0.45)',
        'glow-violet': '0 0 16px rgba(186,95,255,0.4)',
        'card':        '0 4px 24px rgba(0,0,0,0.35)',
        'card-hover':  '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(113,224,126,0.2)',
        'inner-glow':  'inset 0 1px 0 rgba(255,255,255,0.07)',
      },
      backgroundImage: {
        'hero-bg':    'radial-gradient(ellipse at 20% 50%, rgba(98,0,217,0.25) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(186,95,255,0.15) 0%, transparent 50%), linear-gradient(135deg,#0A1C40 0%,#071530 100%)',
        'card-shine': 'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 60%)',
        'topo-lines': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 50 Q25 30 50 50 Q75 70 100 50' fill='none' stroke='rgba(113,224,126,0.06)' stroke-width='1'/%3E%3Cpath d='M0 30 Q25 10 50 30 Q75 50 100 30' fill='none' stroke='rgba(113,224,126,0.04)' stroke-width='1'/%3E%3Cpath d='M0 70 Q25 50 50 70 Q75 90 100 70' fill='none' stroke='rgba(113,224,126,0.04)' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-green':  'pulseGreen 2s ease-in-out infinite',
        'pulse-red':    'pulseRed 1.2s ease-in-out infinite',
        'spin-slow':    'spin 6s linear infinite',
        'fade-up':      'fadeUp .4s cubic-bezier(.16,1,.3,1)',
        'slide-in':     'slideIn .4s cubic-bezier(.16,1,.3,1)',
        'ecg':          'ecgScroll 4s linear infinite',
        'float':        'float 4s ease-in-out infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        pulseGreen:  { '0%,100%':{ boxShadow:'0 0 0 0 rgba(113,224,126,0.4)' },'50%':{ boxShadow:'0 0 0 8px rgba(113,224,126,0)' } },
        pulseRed:    { '0%,100%':{ boxShadow:'0 0 0 0 rgba(239,68,68,0.5)' },'50%':{ boxShadow:'0 0 0 6px rgba(239,68,68,0)' } },
        fadeUp:      { from:{ opacity:'0',transform:'translateY(14px)' },to:{ opacity:'1',transform:'translateY(0)' } },
        slideIn:     { from:{ opacity:'0',transform:'translateX(-14px)' },to:{ opacity:'1',transform:'translateX(0)' } },
        float:       { '0%,100%':{ transform:'translateY(0)' },'50%':{ transform:'translateY(-8px)' } },
        glowPulse:   { '0%,100%':{ opacity:'0.6' },'50%':{ opacity:'1' } },
      },
    },
  },
  plugins:[],
};
