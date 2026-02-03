// @ts-nocheck
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../api/store";
import type { FavoriteContact } from "../../shared/types/favorites";

// ===== Селекторы =====
export const selectUserLat = (state: RootState) => state.presence.lat;
export const selectUserLon = (state: RootState) => state.presence.lon;
export const selectFavoriteContacts = (state: RootState) => state.presence.favoriteContacts;
export const selectTargetLat = (state: RootState) => state.presence.target_lat;
export const selectTargetLon = (state: RootState) => state.presence.target_lon;

// ===== Initial state с localStorage =====
function readNumber(key: string): number | null {
  const v = localStorage.getItem(key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

interface PresenceState {
  lat: number | null;
  lon: number | null;
  favoriteContacts: FavoriteContact[];
  target_lat: number | null;
  target_lon: number | null;
}

const DEFAULT_LAT = 41.20438;
const DEFAULT_LON = 74.76610;

const initialState: PresenceState = {
  lat: readNumber("userLat") ?? DEFAULT_LAT,
  lon: readNumber("userLon") ?? DEFAULT_LON,
  favoriteContacts: readJSON<FavoriteContact[]>("favoriteContacts", []),
  target_lat: readNumber("userLat") ?? DEFAULT_LAT,
  target_lon: readNumber("userLon") ?? DEFAULT_LON,
};

// ===== Slice =====
const presenceSlice = createSlice({
  name: "presence",
  initialState,
  reducers: {
    setLocation: (state, action: PayloadAction<{ lat: number; lon: number }>) => {
      state.lat = action.payload.lat;
      state.lon = action.payload.lon;

      localStorage.setItem("userLat", String(action.payload.lat));
      localStorage.setItem("userLon", String(action.payload.lon));
    },

    // ✅ Новый метод: установить "цель" на карте (target_lat / target_lon)
    setTargetLocation: (state, action: PayloadAction<{ lat: number; lon: number }>) => {
      state.target_lat = action.payload.lat;
      state.target_lon = action.payload.lon;
    },

    setFavoriteContacts: (state, action: PayloadAction<FavoriteContact[]>) => {
      state.favoriteContacts = action.payload;
      localStorage.setItem("favoriteContacts", JSON.stringify(state.favoriteContacts));
    },

    upsertFavoriteContact: (state, action: PayloadAction<FavoriteContact>) => {
      const idx = state.favoriteContacts.findIndex((x) => x.id === action.payload.id);
      if (idx >= 0) {
        state.favoriteContacts[idx] = action.payload;
      } else {
        state.favoriteContacts.push(action.payload);
      }
      localStorage.setItem("favoriteContacts", JSON.stringify(state.favoriteContacts));
    },

    removeFavoriteContact: (state, action: PayloadAction<number>) => {
      state.favoriteContacts = state.favoriteContacts.filter((x) => x.id !== action.payload);
      localStorage.setItem("favoriteContacts", JSON.stringify(state.favoriteContacts));
    },

    clearFavoriteContacts: (state) => {
      state.favoriteContacts = [];
      localStorage.setItem("favoriteContacts", JSON.stringify([]));
    },

    // presenceSlice.ts — добавь эти редьюсеры в createSlice.reducers
    updateFavoriteLocationByUserId: (
      state,
      action: PayloadAction<{ userId: number; latitude: number; longitude: number; updated_at?: string }>
    ) => {
      const { userId, latitude, longitude, updated_at } = action.payload;
      const item = state.favoriteContacts.find(fc => fc.contact?.id === userId);
      if (item) {
        item.location = {
          ...(item.location ?? {}),
          latitude,
          longitude,
          updated_at: updated_at ?? new Date().toISOString(),
        } as any;
      }
    },

    updateFavoritePresenceByUserId: (
      state,
      action: PayloadAction<{ userId: number; is_online: boolean; last_seen?: string | null }>
    ) => {
      const { userId, is_online, last_seen } = action.payload;
      const item = state.favoriteContacts.find(fc => fc.contact?.id === userId);
      if (item && item.contact) {
        item.contact.is_online = is_online;
        if (typeof last_seen !== "undefined") item.contact.last_seen = last_seen;
      }
    },
    },
});

export const {
  setLocation,
  setTargetLocation, // 👈 добавлено
  setFavoriteContacts,
  upsertFavoriteContact,
  removeFavoriteContact,
  clearFavoriteContacts,
  updateFavoriteLocationByUserId,
  updateFavoritePresenceByUserId,
} = presenceSlice.actions;

export default presenceSlice.reducer;