// services/seedService.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const { Inventory, Camera, Alert } = require('../models/index');

const MONGO = process.env.MONGO_URI || 'mongodb://sruser:srpass@localhost:27018/smartretail?authSource=admin';

const PRODUCTS = [
  { sku:'SKU-001',name:'Samsung 55" QLED TV',    category:'Electronics',   zone:'Electronics',   shelf:'A1', stockLevel:24, minStock:5,  maxStock:50, sellPrice:89999,unitCost:65000 },
  { sku:'SKU-002',name:'Nike Air Max Sneakers',  category:'Fashion',       zone:'Fashion',       shelf:'B3', stockLevel:8,  minStock:10, maxStock:80, sellPrice:12999,unitCost:7500  },
  { sku:'SKU-003',name:'Basmati Rice 5kg',        category:'Grocery',      zone:'Grocery',       shelf:'C2', stockLevel:142,minStock:30, maxStock:200,sellPrice:399,  unitCost:280   },
  { sku:'SKU-004',name:'Philips Air Fryer',       category:'Home & Living',zone:'Home & Living', shelf:'D1', stockLevel:19, minStock:5,  maxStock:40, sellPrice:7499, unitCost:5000  },
  { sku:'SKU-005',name:'Apple iPhone 15',         category:'Electronics',  zone:'Electronics',   shelf:'A2', stockLevel:6,  minStock:5,  maxStock:30, sellPrice:79999,unitCost:62000 },
  { sku:'SKU-006',name:'Levi\'s 511 Slim Jeans', category:'Fashion',      zone:'Fashion',       shelf:'B1', stockLevel:0,  minStock:10, maxStock:60, sellPrice:3499, unitCost:1800  },
  { sku:'SKU-007',name:'Extra Virgin Olive Oil',  category:'Grocery',     zone:'Grocery',       shelf:'C5', stockLevel:55, minStock:20, maxStock:120,sellPrice:699,  unitCost:480   },
  { sku:'SKU-008',name:'Dyson V12 Vacuum',        category:'Home & Living',zone:'Home & Living',shelf:'D3', stockLevel:3,  minStock:5,  maxStock:20, sellPrice:45999,unitCost:32000 },
  { sku:'SKU-009',name:'Sony WH-1000XM5 Headphones',category:'Electronics',zone:'Electronics',  shelf:'A3', stockLevel:12, minStock:5,  maxStock:30, sellPrice:29999,unitCost:20000 },
  { sku:'SKU-010',name:'Zara Floral Dress',       category:'Fashion',     zone:'Fashion',       shelf:'B2', stockLevel:22, minStock:8,  maxStock:50, sellPrice:2499, unitCost:900   },
];

PRODUCTS.forEach(p => {
  if (p.stockLevel === 0) p.status = 'out_of_stock';
  else if (p.stockLevel < p.minStock) p.status = 'low_stock';
  else if (p.stockLevel > p.maxStock * 0.9) p.status = 'overstocked';
  else p.status = 'in_stock';
});

async function seed() {
  await mongoose.connect(MONGO);
  console.log('[Seed] MongoDB connected');
  await Promise.all([Inventory.deleteMany({}), Alert.deleteMany({})]);
  await Inventory.insertMany(PRODUCTS);
  console.log(`[Seed] ${PRODUCTS.length} products seeded`);
  await Alert.insertMany([
    { type:'LOW_STOCK', severity:'warning', zone:'Fashion', message:'Nike Air Max Sneakers below min stock (8 units)', acknowledged:true },
    { type:'LOW_STOCK', severity:'critical', zone:'Home & Living', message:'Dyson V12 critically low (3 units)', acknowledged:false },
    { type:'SHRINKAGE', severity:'critical', zone:'Electronics', message:'Item exit without scan — iPhone 15 area', acknowledged:false },
  ]);
  console.log('[Seed] Alerts seeded');
  console.log('[Seed] Done');
  await mongoose.disconnect();
  process.exit(0);
}
seed().catch(e => { console.error(e); process.exit(1); });
