// src/pages/InventoryPage.tsx
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Package, Search, AlertTriangle, RefreshCw } from 'lucide-react';
import useStore from '@/store/useStore';
import { inventoryApi } from '@/lib/api';
import type { InventoryItem, StockStatus } from '@/types';

const STATUS_META: Record<StockStatus, { label:string; cls:string; color:string }> = {
  in_stock:     { label:'In Stock',     cls:'badge-success', color:'#16a34a' },
  low_stock:    { label:'Low Stock',    cls:'badge-warn',    color:'#d97706' },
  out_of_stock: { label:'Out of Stock', cls:'badge-danger',  color:'#dc2626' },
  overstocked:  { label:'Overstocked',  cls:'badge-navy',    color:'#0145f2' },
};

export default function InventoryPage() {
  const ref       = useRef<HTMLDivElement>(null);
  const { inventory, setInventory } = useStore();
  const [search,  setSearch]   = useState('');
  const [filter,  setFilter]   = useState<string>('all');
  const [loading, setLoading]  = useState(false);

  async function load() {
    setLoading(true);
    try { const r = await inventoryApi.list(); setInventory(r.data.data); } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    gsap.fromTo('.inv-row', { opacity:0, y:8 }, { opacity:1, y:0, stagger:0.04, duration:0.4, ease:'power3.out' });
  }, []);

  const filtered = inventory
    .filter(i => filter === 'all' || i.status === filter)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all:         inventory.length,
    in_stock:    inventory.filter(i=>i.status==='in_stock').length,
    low_stock:   inventory.filter(i=>i.status==='low_stock').length,
    out_of_stock:inventory.filter(i=>i.status==='out_of_stock').length,
  };

  return (
    <div ref={ref} className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-mono font-bold text-slate-900" style={{ fontSize:18, letterSpacing:'0.05em' }}>Inventory Intelligence</h1>
          <p className="font-mono text-slate-400 text-xs mt-0.5">Real-time stock levels · MongoDB</p>
        </div>
        <button onClick={load} className="btn-ghost">
          <RefreshCw size={12} className={loading?'animate-spin':''} /> Refresh
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label:'Total SKUs',     val:counts.all,         color:'#0145f2' },
          { label:'In Stock',       val:counts.in_stock,    color:'#16a34a' },
          { label:'Low Stock',      val:counts.low_stock,   color:'#d97706' },
          { label:'Out of Stock',   val:counts.out_of_stock,color:'#dc2626' },
        ].map(k => (
          <div key={k.label} className="card px-4 py-3">
            <div className="section-label mb-1" style={{ fontSize:8 }}>{k.label}</div>
            <div className="font-mono font-bold" style={{ fontSize:24, color:k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e=>setSearch(e.target.value)} className="input pl-8 py-1.5 text-xs" placeholder="Search SKU or name…" />
        </div>
        <div className="flex gap-1">
          {(['all','in_stock','low_stock','out_of_stock'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      filter===f ? 'border-navy text-navy bg-navy/8' : 'border-slate-200 text-slate-500 hover:border-navy/50'}`}
                    style={{ background: filter===f ? 'rgba(1,69,242,0.07)' : 'transparent' }}>
              {f.replace('_',' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead style={{ borderBottom:'1px solid #e2e8f0' }}>
            <tr className="table-head px-4">
              <th className="text-left py-3 px-4">Product</th>
              <th className="text-left py-3 px-3">SKU</th>
              <th className="text-left py-3 px-3">Zone / Shelf</th>
              <th className="text-left py-3 px-3">Stock Level</th>
              <th className="text-left py-3 px-3">Status</th>
              <th className="text-right py-3 px-4">Price</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, idx) => {
              const meta  = STATUS_META[item.status];
              const pct   = Math.round((item.stockLevel / item.maxStock) * 100);
              const isLow = item.status === 'low_stock' || item.status === 'out_of_stock';
              return (
                <motion.tr key={item._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                           transition={{ delay:idx*0.03 }}
                           className="inv-row border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-sans text-sm font-medium text-slate-800">{item.name}</div>
                    <div className="font-mono text-xs text-slate-400">{item.category}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-xs text-slate-600">{item.sku}</td>
                  <td className="py-3 px-3">
                    <div className="font-sans text-xs text-slate-600">{item.zone}</div>
                    <div className="font-mono text-xs text-slate-400">Shelf {item.shelf}</div>
                  </td>
                  <td className="py-3 px-3" style={{ minWidth:120 }}>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 stock-bar">
                        <div className="stock-fill" style={{
                          width:`${pct}%`,
                          background: item.status==='out_of_stock' ? '#dc2626'
                            : item.status==='low_stock' ? '#d97706'
                            : '#0145f2',
                        }} />
                      </div>
                      <span className="font-mono text-xs font-bold" style={{ color: meta.color, minWidth:28 }}>
                        {item.stockLevel}
                      </span>
                    </div>
                    <div className="font-mono text-slate-400 mt-0.5" style={{ fontSize:9 }}>
                      min {item.minStock} · max {item.maxStock}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={meta.cls}>{meta.label}</span>
                    {isLow && <AlertTriangle size={11} className="inline ml-1.5" color={meta.color} />}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{item.sellPrice?.toLocaleString('en-IN') ?? '—'}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 font-mono text-xs text-slate-400">
            {loading ? 'Loading inventory…' : 'No products found'}
          </div>
        )}
      </div>
    </div>
  );
}
