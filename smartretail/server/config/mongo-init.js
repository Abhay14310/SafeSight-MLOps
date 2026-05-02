// server/config/mongo-init.js
db = db.getSiblingDB('smartretail');
db.createCollection('cameras');
db.createCollection('footfall');
db.createCollection('inventory');
db.createCollection('alerts');
db.createCollection('products');
db.createCollection('shelves');
print('[mongo-init] smartretail collections created');
