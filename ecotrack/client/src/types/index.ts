// src/types/index.ts
export type WasteType='organic'|'recyclable'|'hazardous'|'e-waste'|'medical'|'general'|'construction';
export type VehicleStatus='active'|'idle'|'maintenance'|'offline';
export type BinStatus='empty'|'partial'|'full'|'overflow'|'damaged';
export type RouteStatus='planned'|'active'|'completed'|'cancelled';
export type AlertSeverity='info'|'warning'|'critical';
export type UserRole='admin'|'manager'|'driver'|'analyst'|'supervisor';

export interface User { id:string; name:string; email:string; role:UserRole; zone?:string; preferences?:{ notifications:boolean; emailAlerts:boolean; theme:string }; }

export interface WasteLog {
  _id:string; logId:string; vehicleId:string; driverId?:string; zone:string; binId?:string;
  wasteType:WasteType; weightKg:number; volumeL?:number; status:string;
  collectedAt:string; notes?:string; photoUrl?:string; geoLocation?:{lat:number;lng:number};
  createdAt:string;
}

export interface Vehicle {
  _id:string; vehicleId:string; regNumber:string; type:string; capacity:number;
  currentLoad:number; fuelType:string; status:VehicleStatus; driverId?:string; driverName?:string;
  currentZone?:string; currentLat?:number; currentLng?:number; mileage:number; co2Saved?:number; createdAt:string;
}

export interface VehicleFrame extends Vehicle {
  capacityPct:number; lat:number; lng:number; speed:number; timestamp:string;
}

export interface Bin {
  _id:string; binId:string; zone:string; address?:string; wasteType:string;
  capacityL:number; fillLevel:number; status:BinStatus; lastEmptied?:string; lat?:number; lng?:number;
}

export interface BinUpdate { binId:string; fillLevel:number; zone:string; wasteType:string; }

export interface Route {
  _id:string; routeId:string; name:string; zone?:string; vehicleId?:string; driverId?:string;
  status:RouteStatus; scheduledAt?:string; startedAt?:string; completedAt?:string;
  distanceKm?:number; estimatedMin?:number; actualMin?:number; totalWeightKg?:number;
}

export interface Schedule {
  _id:string; scheduleId:string; zone:string; vehicleId?:string; driverId?:string;
  wasteType?:string; frequency:string; dayOfWeek:number[]; timeSlot?:string;
  isActive:boolean; nextPickup?:string;
}

export interface Alert {
  _id:string; type:string; severity:AlertSeverity; zone?:string; vehicleId?:string;
  binId?:string; message:string; metadata?:Record<string,unknown>;
  acknowledged:boolean; resolved:boolean; resolvedAt?:string; createdAt:string;
}

export interface DashSummary {
  totalLogs:number; todayWeight:number; activeVehicles:number; totalVehicles:number;
  fullBins:number; totalBins:number; alerts:number; recycledToday:number; co2Saved:number;
  byType:Array<{_id:string;total:number;count:number}>;
}

export interface LiveCollection {
  vehicleId:string; zone:string; wasteType:WasteType; weightKg:number; status:string; timestamp:string;
}
