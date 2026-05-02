// services/socketService.js
class SocketService {
  constructor(io) { this.io = io; }

  emitToPatient(patientId, event, data) {
    this.io.to(`patient:${patientId}`).emit(event, data);
  }

  emitToNurses(event, data) {
    this.io.to('nurses').emit(event, data);
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }
}
module.exports = SocketService;
