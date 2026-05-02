// src/components/ToastStack.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import useStore from '@/store/useStore';

const TOAST_META = {
  success: { icon:<CheckCircle size={14}/>, color:'#00ff88', bg:'rgba(0,255,136,0.08)', border:'rgba(0,255,136,0.25)' },
  error:   { icon:<XCircle size={14}/>,     color:'#FF0000', bg:'rgba(255,0,0,0.08)',   border:'rgba(255,0,0,0.3)'   },
  warning: { icon:<AlertTriangle size={14}/>,color:'#ffaa00', bg:'rgba(255,170,0,0.08)',border:'rgba(255,170,0,0.3)' },
  info:    { icon:<Info size={14}/>,         color:'#00d4ff', bg:'rgba(0,212,255,0.07)',border:'rgba(0,212,255,0.25)' },
};

export default function ToastStack() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed bottom-4 right-4 z-[2000] flex flex-col gap-2 pointer-events-none"
         style={{ maxWidth: 320 }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const meta = TOAST_META[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity:0, x:24, scale:0.95 }}
              animate={{ opacity:1, x:0,  scale:1 }}
              exit={{ opacity:0, x:24, scale:0.95 }}
              transition={{ duration:0.25, ease:[0.16,1,0.3,1] }}
              className="pointer-events-auto rounded-lg border px-3 py-2.5 flex items-start gap-2.5"
              style={{
                background: meta.bg,
                borderColor: meta.border,
                backdropFilter: 'blur(16px)',
              }}
            >
              <span style={{ color: meta.color, flexShrink:0, marginTop:1 }}>{meta.icon}</span>
              <p className="font-mono text-white flex-1" style={{ fontSize:11, lineHeight:1.4 }}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-grey-400 hover:text-white transition-colors mt-0.5"
              >
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
