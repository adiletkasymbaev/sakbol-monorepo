export interface PolygonPoint {
  lat: number;
  lng: number;
}

export interface Geofence {
  id: number;
  name: string;
  children: number[];         // list of user PKs
  polygon: PolygonPoint[];
  arrive_time: string | null; // "HH:MM:SS"
  depart_time: string | null;
  remind_minutes: number[];
  is_active: boolean;
  created_at: string;         // ISO datetime
}

export interface GeofenceCreateBody {
  name: string;
  children: number[];
  polygon: PolygonPoint[];
  arrive_time?: string | null;
  depart_time?: string | null;
  remind_minutes?: number[];
  is_active?: boolean;
}

export interface GeofenceUpdateBody extends Partial<GeofenceCreateBody> {}

export interface PaginatedGeofences {
  count: number;
  next: string | null;
  previous: string | null;
  results: Geofence[];
}

export interface CheckOutsideResult {
  outside: boolean | null;    // null if no location data
  child_id: number;
  geofence_id: number;
  latitude: number | null;
  longitude: number | null;
  reason?: "no_location";     // present when outside is null
}