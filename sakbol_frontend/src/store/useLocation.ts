import { create } from "zustand";
import type { ContactLocation } from "../shared/types/locations";
import { locationService } from "../shared/services/locationService";

type LocationState = {
  // отображаемая точка (например, выбранная на карте)
  displayLat: number | null;
  displayLon: number | null;

  // реальная геолокация пользователя
  geoLat: number | null;
  geoLon: number | null;

  // контакты
  contactsLocations: ContactLocation[];
  isLoading: boolean;

  // setters
  setDisplayLocation: (lat: number, lon: number) => void;
  setGeoLocation: (lat: number, lon: number) => void;

  // api methods
  fetchContactsLocations: () => Promise<void>;
  updateMyLocation: (lat: number, lon: number) => Promise<void>;
};

export const useLocation = create<LocationState>((set) => ({
  displayLat: null,
  displayLon: null,

  geoLat: null,
  geoLon: null,

  contactsLocations: [],
  isLoading: false,

  setDisplayLocation: (lat, lon) =>
    set({
      displayLat: lat,
      displayLon: lon,
    }),

  setGeoLocation: (lat, lon) =>
    set({
      geoLat: lat,
      geoLon: lon,
    }),

  fetchContactsLocations: async () => {
    set({ isLoading: true });

    try {
      const { data } = await locationService.getLocations();
      set({ contactsLocations: data });
    } finally {
      set({ isLoading: false });
    }
  },

  updateMyLocation: async (lat, lon) => {
    await locationService.updateMyLocation({
      latitude: lat,
      longitude: lon,
    });

    set({
      geoLat: lat,
      geoLon: lon,
    });
  },
}));