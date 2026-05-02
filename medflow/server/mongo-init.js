// mongo-init.js — runs once when the MongoDB container initialises
db = db.getSiblingDB('medflow');
db.createCollection('patients');
db.createCollection('vitallogs');
db.createCollection('labreports');
db.createCollection('alerts');
db.createCollection('users');
print('[mongo-init] medflow database and collections created');
