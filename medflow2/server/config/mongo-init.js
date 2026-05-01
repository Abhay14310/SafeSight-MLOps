db = db.getSiblingDB('medflow2');
db.createCollection('patients');
db.createCollection('vitallogs');
db.createCollection('alerts');
db.createCollection('tasks');
db.createCollection('users');
db.createCollection('poseframes');
print('[mongo-init] medflow2 collections created');
