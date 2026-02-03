import { create } from "zustand";
import L from "leaflet";
import type { TimeInputValue } from "@heroui/react";
import { parseAbsoluteToLocal } from "@internationalized/date";
import { attachZoneMeta } from "../utils/attachZoneMeta";
import { bindZoneTooltip } from "../utils/bindZoneTooltip";
import { DEFAULT_ZONE_NAME, ZONES_LS_KEY } from "../utils/consts";
import { createDrawControl } from "../utils/createDrawControl";
import { getZoneName } from "../utils/getZoneName";
import { loadZonesFromLS } from "../utils/loadZonesFromLS";
import { saveZonesToLS } from '../utils/saveZonesToLS';

type ZonesStore = {
  // UI state
  polyColor: string;
  polyName: string;
  startTime: TimeInputValue;
  endTime: TimeInputValue;

  setPolyColor: (v: string) => void;
  setPolyName: (v: string) => void;
  setStartTime: (v: TimeInputValue) => void;
  setEndTime: (v: TimeInputValue) => void;

  // Leaflet runtime
  featureGroup: L.FeatureGroup | null;
  drawControl: L.Control.Draw | null;

  // actions
  initOnMap: (map: L.Map) => void;
  destroyFromMap: (map: L.Map) => void;
  clearZones: () => void;

  // show drawing button
  isDrawable: boolean;
  setDrawable: (v: boolean) => void;
};

export const useZonesStore = create<ZonesStore>((set, get) => ({
  polyColor: "#ff0000",
  polyName: "",
  startTime: parseAbsoluteToLocal("2025-02-03T14:45:22Z"),
  endTime: parseAbsoluteToLocal("2025-02-03T14:45:22Z"),

  setPolyColor: (v) => set({ polyColor: v }),
  setPolyName: (v) => set({ polyName: v }),
  setStartTime: (v) => set({ startTime: v }),
  setEndTime: (v) => set({ endTime: v }),

  featureGroup: null,
  drawControl: null,

  initOnMap: (map) => {
    // не инициализируем повторно
    if (get().featureGroup) return;

    const fg = new L.FeatureGroup();
    map.addLayer(fg);

    // load saved
    const saved = loadZonesFromLS();
    if (saved) {
      L.geoJSON(saved as any, {
        onEachFeature: (feature, layer) => {
          if (layer instanceof L.Polygon) {
            const props: any = feature.properties || {};
            (layer as any).feature = feature;

            const title = props.name ?? DEFAULT_ZONE_NAME;
            const st = props.startTime ?? "";
            const et = props.endTime ?? "";

            bindZoneTooltip(layer, title, st, et);
            fg.addLayer(layer);
          }
        },
      });
    }

    const dc = createDrawControl(get().polyColor, fg);
    map.addControl(dc);

    // handlers
    const onCreated = (e: any) => {
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
      saveZonesToLS(fg);
    };

    const onEdited = () => saveZonesToLS(fg);
    const onDeleted = () => saveZonesToLS(fg);

    map.on(L.Draw.Event.CREATED, onCreated);
    map.on(L.Draw.Event.EDITED, onEdited);
    map.on(L.Draw.Event.DELETED, onDeleted);

    // сохраняем всё, чтобы можно было корректно снять обработчики в destroy
    set({
      featureGroup: fg,
      drawControl: dc,
    });

    // сохраним callbacks в замыканиях через map (как "private")
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

  clearZones: () => {
    localStorage.removeItem(ZONES_LS_KEY);

    const fg = get().featureGroup;
    if (fg) fg.clearLayers();
  },

  // show edit btn
  isDrawable: false,
  setDrawable: (v) => set({ isDrawable: v })
}));