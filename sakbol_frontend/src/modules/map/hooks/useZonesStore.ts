import { create } from "zustand";
import L from "leaflet";
import type { TimeInputValue } from "@heroui/react";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { attachZoneMeta } from "../utils/attachZoneMeta";
import { bindZoneTooltip } from "../utils/bindZoneTooltip";
import { createDrawControl } from "../utils/createDrawControl";
import { getZoneName } from "../utils/getZoneName";
import { formatTime } from "../../../shared/utils/formatTime";
import { geofencesService } from "../../../shared/services/geofencesService";
import type { Geofence } from "../../../shared/types/geofences";

type ZonesStore = {
  // UI state
  polyColor: string;
  polyName: string;
  startTime: TimeInputValue;
  endTime: TimeInputValue;
  selectedChildren: number[];   // user IDs chosen in the picker

  setPolyColor: (v: string) => void;
  setPolyName: (v: string) => void;
  setStartTime: (v: TimeInputValue) => void;
  setEndTime: (v: TimeInputValue) => void;
  toggleChild: (userId: number) => void;
  setSelectedChildren: (ids: number[]) => void;

  // Leaflet runtime
  featureGroup: L.FeatureGroup | null;
  drawControl: L.Control.Draw | null;

  // async state
  isSaving: boolean;
  isLoadingZones: boolean;
  saveError: string | null;

  // actions
  initOnMap: (map: L.Map) => void;
  destroyFromMap: (map: L.Map) => void;
  clearZones: () => Promise<void>;

  // show drawing button
  isDrawable: boolean;
  setDrawable: (v: boolean) => void;
};

/** Convert a Leaflet Polygon to [{lat, lng}, ...] */
function polygonToPoints(layer: L.Polygon) {
  const latlngs = layer.getLatLngs()[0] as L.LatLng[];
  return latlngs.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
}

/** Render backend geofences onto the map's FeatureGroup */
function renderGeofences(geofences: Geofence[], fg: L.FeatureGroup) {
  fg.clearLayers();
  for (const fence of geofences) {
    const points = fence.polygon as { lat: number; lng: number }[];
    if (!points || points.length < 3) continue;

    const latlngs = points.map((p) => L.latLng(p.lat, p.lng));
    const poly = L.polygon(latlngs);

    const st = fence.arrive_time ?? "";
    const et = fence.depart_time ?? "";

    // store backend id on the layer for later delete/edit
    (poly as any).__geofenceId = fence.id;

    bindZoneTooltip(poly, fence.name, st, et);
    fg.addLayer(poly);
  }
}

export const useZonesStore = create<ZonesStore>((set, get) => ({
  polyColor: "#ff0000",
  polyName: "",
  startTime: parseAbsoluteToLocal("2025-02-03T14:45:22Z"),
  endTime: parseAbsoluteToLocal("2025-02-03T14:45:22Z"),
  selectedChildren: [],

  setPolyColor: (v) => set({ polyColor: v }),
  setPolyName: (v) => set({ polyName: v }),
  setStartTime: (v) => set({ startTime: v }),
  setEndTime: (v) => set({ endTime: v }),
  toggleChild: (userId) =>
    set((s) => ({
      selectedChildren: s.selectedChildren.includes(userId)
        ? s.selectedChildren.filter((id) => id !== userId)
        : [...s.selectedChildren, userId],
    })),
  setSelectedChildren: (ids) => set({ selectedChildren: ids }),

  featureGroup: null,
  drawControl: null,

  isSaving: false,
  isLoadingZones: false,
  saveError: null,

  initOnMap: (map) => {
    if (get().featureGroup) return;

    const fg = new L.FeatureGroup();
    map.addLayer(fg);

    const dc = createDrawControl(get().polyColor, fg);
    map.addControl(dc);

    // Load existing geofences from backend
    set({ isLoadingZones: true });
    geofencesService
      .getAll()
      .then((res) => {
        const fences: Geofence[] = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];
        renderGeofences(fences, fg);
      })
      .catch(console.error)
      .finally(() => set({ isLoadingZones: false }));

    // ── CREATED handler ──────────────────────────────────────────────
    const onCreated = async (e: any) => {
      const layer = e.layer as L.Polygon;
      const state = get();
      const zoneTitle = getZoneName(state.polyName);

      attachZoneMeta(layer, {
        name: zoneTitle,
        color: state.polyColor,
        startTime: state.startTime,
        endTime: state.endTime,
      });

      fg.addLayer(layer);

      if (state.selectedChildren.length === 0) {
        // Still add to map visually, but warn — no children means backend will reject
        set({ saveError: "Выберите хотя бы одного ребёнка перед созданием зоны." });
        fg.removeLayer(layer);
        return;
      }

      set({ isSaving: true, saveError: null });
      try {
        const created = await geofencesService.create({
          name: zoneTitle,
          children: state.selectedChildren,
          polygon: polygonToPoints(layer),
          arrive_time: formatTime(state.startTime) || null,
          depart_time: formatTime(state.endTime) || null,
          remind_minutes: [2, 5, 10, 30, 60, 120],
          is_active: true,
        });

        // tag layer with real backend id
        (layer as any).__geofenceId = created.data.id;
      } catch (err: any) {
        set({ saveError: "Ошибка сохранения зоны." });
        fg.removeLayer(layer);
      } finally {
        set({ isSaving: false });
      }
    };

    // ── EDITED handler ───────────────────────────────────────────────
    const onEdited = async (e: any) => {
      const layers = e.layers as L.LayerGroup;
      layers.eachLayer(async (layer: any) => {
        const id: number | undefined = layer.__geofenceId;
        if (!id) return;
        try {
          await geofencesService.partialUpdate(id, {
            polygon: polygonToPoints(layer as L.Polygon),
          });
        } catch {
          console.error("Ошибка обновления зоны", id);
        }
      });
    };

    // ── DELETED handler ──────────────────────────────────────────────
    const onDeleted = async (e: any) => {
      const layers = e.layers as L.LayerGroup;
      layers.eachLayer(async (layer: any) => {
        const id: number | undefined = layer.__geofenceId;
        if (!id) return;
        try {
          await geofencesService.destroy(id);
        } catch {
          console.error("Ошибка удаления зоны", id);
        }
      });
    };

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    set({ featureGroup: fg, drawControl: dc });

    // @ts-expect-error - internal
    map.__zonesHandlers = { onCreated, onEdited, onDeleted };
  },

  destroyFromMap: (map) => {
    const fg = get().featureGroup;
    const dc = get().drawControl;

    // @ts-expect-error - internal
    const handlers = map.__zonesHandlers;
    if (handlers) {
      map.off(L.Draw.Event.CREATED, handlers.onCreated);
      map.off(L.Draw.Event.EDITED, handlers.onEdited);
      map.off(L.Draw.Event.DELETED, handlers.onDeleted);
      // @ts-expect-error - internal
      delete map.__zonesHandlers;
    }

    if (dc) map.removeControl(dc);
    if (fg) map.removeLayer(fg);

    set({ featureGroup: null, drawControl: null });
  },

  clearZones: async () => {
    // Delete all known geofences from backend
    const fg = get().featureGroup;
    if (!fg) return;

    const deletePromises: Promise<any>[] = [];
    fg.eachLayer((layer: any) => {
      const id: number | undefined = layer.__geofenceId;
      if (id) deletePromises.push(geofencesService.destroy(id).catch(console.error));
    });

    await Promise.all(deletePromises);
    fg.clearLayers();
  },

  isDrawable: false,
  setDrawable: (v) => set({ isDrawable: v }),
}));