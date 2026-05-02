require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors:{ origin: process.env.CLIENT_URL||'http://localhost:3010', methods:['GET','POST'], credentials:true },
  transports:['websocket','polling'],
});
const { User } = require('./models/index');
const seedDemoData = require('./services/seedService');

app.use(helmet({ crossOriginEmbedderPolicy:false }));
app.use(cors({ origin: process.env.CLIENT_URL||'http://localhost:3010', credentials:true }));
app.use(express.json({ limit:'20mb' }));
app.use(morgan(process.env.NODE_ENV==='production'?'combined':'dev'));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

app.use('/api/auth',     require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/vitals',   require('./routes/vitals'));
app.use('/api/alerts',   require('./routes/alerts'));
app.use('/api/tasks',    require('./routes/tasks'));
app.use('/api/pose',     require('./routes/pose'));
app.use('/api/settings', require('./routes/settings'));

app.get('/health', (req,res)=>res.json({
  status:'ok', ts:new Date().toISOString(), uptime:process.uptime(),
  mongo: mongoose.connection.readyState===1?'connected':'disconnected',
  services:{
    'ai-pose-engine':       'running',
    'ecg-stream-processor': 'running',
    'vital-monitor-svc':    'running',
    'hl7-fhir-gateway':     'running',
    'alert-bus':            'running',
    'audit-logger':         'running',
    'mf2-server':           'running',
    'mf2-mongo':            mongoose.connection.readyState===1?'running':'stopped',
    'mf2-client':           'running',
  },
}));

app.use((err,req,res,_next)=>{ console.error('[ERR]',err.message); res.status(err.status||500).json({error:err.message}); });

// Socket
const VitalsService = require('./services/vitalsService');
const PoseService   = require('./services/poseService');

function initSockets(){
  io.on('connection',(socket)=>{
    console.log(`[WS] ${socket.id} connected`);
    socket.on('join_ward',    ()=>socket.join('ward'));
    socket.on('watch_patient',({patientId})=>socket.join(`patient:${patientId}`));
    socket.on('leave_patient',({patientId})=>socket.leave(`patient:${patientId}`));
    socket.on('ack_alert',async({alertId})=>{
      const { Alert }=require('./models/index');
      await Alert.findByIdAndUpdate(alertId,{acknowledged:true}).catch(()=>{});
      io.to('ward').emit('alert_acked',{alertId});
    });
    socket.on('disconnect',()=>console.log(`[WS] ${socket.id} disconnected`));
  });

  const vitals = new VitalsService(io);
  const pose   = new PoseService(io);
  vitals.start();
  pose.start();
}

async function start(){
  await mongoose.connect(process.env.MONGO_URI||'mongodb://localhost:27020/medflow2');
  console.log('[DB] MongoDB connected');
  const userCount = await User.countDocuments().catch(()=>0);
  if (!userCount){
    console.log('[Seed] No users found, seeding demo data');
    await seedDemoData();
  }
  initSockets();
  const PORT = process.env.PORT||5060;
  server.listen(PORT,()=>console.log(`[SERVER] MedFlow2 on :${PORT}`));
}
start();
module.exports = { app, io };
