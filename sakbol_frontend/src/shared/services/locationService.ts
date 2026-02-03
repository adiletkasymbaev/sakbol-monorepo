import { API_ENDPOINTS } from "../enums/ApiEndpoints"
import api from "./axios"

export const locationService = {
    getLocations: () => {
        return api.get(API_ENDPOINTS.LOCATION.CONTACTS)
    },

    updateMyLocation: (data: { latitude: number; longitude: number }) => {
        return api.post(API_ENDPOINTS.LOCATION.UPDATE, data);
    },
}