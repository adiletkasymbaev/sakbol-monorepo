import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type {
  Geofence,
  GeofenceCreateBody,
  GeofenceUpdateBody,
  PaginatedGeofences,
  CheckOutsideResult,
} from "../types/geofences";
import api from "./axios";

export const geofencesService = {
  /** GET /geofences/?page=N */
  getAll: (page?: number) => {
    return api.get<PaginatedGeofences>(API_ENDPOINTS.GEOFENCES.LIST, {
      params: page ? { page } : undefined,
    });
  },

  /** GET /geofences/{id}/ */
  getById: (id: number) => {
    return api.get<Geofence>(API_ENDPOINTS.GEOFENCES.BY_ID(id));
  },

  /** POST /geofences/ */
  create: (data: GeofenceCreateBody) => {
    return api.post<Geofence>(API_ENDPOINTS.GEOFENCES.LIST, data);
  },

  /** PUT /geofences/{id}/ */
  update: (id: number, data: GeofenceCreateBody) => {
    return api.put<Geofence>(API_ENDPOINTS.GEOFENCES.BY_ID(id), data);
  },

  /** PATCH /geofences/{id}/ */
  partialUpdate: (id: number, data: GeofenceUpdateBody) => {
    return api.patch<Geofence>(API_ENDPOINTS.GEOFENCES.BY_ID(id), data);
  },

  /** DELETE /geofences/{id}/ */
  destroy: (id: number) => {
    return api.delete<void>(API_ENDPOINTS.GEOFENCES.BY_ID(id));
  },

  /** GET /geofences/{id}/check-outside/?child_id={childId} */
  checkOutside: (geofenceId: number, childId: number) => {
    return api.get<CheckOutsideResult>(
      API_ENDPOINTS.GEOFENCES.CHECK_OUTSIDE(geofenceId, childId)
    );
  },
};