// server/config/mongo-init.js
db = db.getSiblingDB('ecotrack');
db.createCollection('wastelogs');
db.createCollection('vehicles');
db.createCollection('routes');
db.createCollection('bins');
db.createCollection('schedules');
db.createCollection('alerts');
db.createCollection('users');
print('[mongo-init] ecotrack collections created');
