// services/mockPOSService.js
const { v4: uuid } = require('uuid');
const { Alert }    = require('../models/index');

const ZONES     = ['Electronics','Fashion','Grocery','Home & Living','Checkout','Entrance'];
const PRODUCTS  = [
  { sku:'SKU-001', name:'Samsung 55" QLED TV',    cat:'Electronics', price:89999 },
  { sku:'SKU-002', name:'Nike Air Max Sneakers',  cat:'Fashion',     price:12999 },
  { sku:'SKU-003', name:'Basmati Rice 5kg',       cat:'Grocery',     price:399   },
  { sku:'SKU-004', name:'Philips Air Fryer',      cat:'Home & Living',price:7499 },
  { sku:'SKU-005', name:'Apple iPhone 15',        cat:'Electronics', price:79999  },
  { sku:'SKU-006', name:'Levi\'s Jeans',          cat:'Fashion',     price:3499   },
  { sku:'SKU-007', name:'Olive Oil 1L',           cat:'Grocery',     price:699    },
  { sku:'SKU-008', name:'Dyson V12 Vacuum',       cat:'Home & Living',price:45999 },
];
const PAYMENT   = ['cash','card','upi','wallet'];

class MockPOSService {
  constructor(io) { this.io = io; this.total = 0; this.txCount = 0; }

  start() {
    setInterval(() => this._emitTransaction(), 4000 + Math.random() * 3000);
    console.log('[POS] Mock POS service started');
  }

  async _emitTransaction() {
    const zone     = ZONES[Math.floor(Math.random() * ZONES.length)];
    const items    = Math.ceil(Math.random() * 4);
    const products = Array.from({ length: items }, () =>
      PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]
    );
    const subtotal = products.reduce((s, p) => s + p.price * (Math.random() < 0.2 ? 0.9 : 1), 0);
    const total    = Math.round(subtotal * 100) / 100;

    this.total   += total;
    this.txCount += 1;

    const tx = {
      txId:       uuid(),
      terminalId: `T${Math.ceil(Math.random() * 8).toString().padStart(3,'0')}`,
      zone,
      total,
      items,
      products: products.map(p => ({ sku: p.sku, name: p.name, category: p.cat, price: p.price })),
      payment: PAYMENT[Math.floor(Math.random() * PAYMENT.length)],
      timestamp: new Date().toISOString(),
      dailyTotal: Math.round(this.total),
      dailyTxCount: this.txCount,
    };

    this.io.to('dashboard').emit('pos_transaction', tx);
    this.io.emit('pos_transaction', tx); // all clients

    // Occasional shrinkage alert
    if (Math.random() < 0.04) {
      const alert = await Alert.create({
        type: 'SHRINKAGE', severity: 'critical', zone,
        message: `Shrinkage detected in ${zone} — item exit without scan`,
        metadata: { zone, tx: tx.txId },
      });
      this.io.emit('new_alert', alert);
    }
  }
}

module.exports = MockPOSService;
