import type { TimeInputValue } from "@heroui/react";
import { formatTime } from "../../../shared/utils/formatTime";
import { bindZoneTooltip } from "./bindZoneTooltip";

export function attachZoneMeta(
  layer: L.Polygon,
  meta: {
    name: string;
    color: string;
    startTime: TimeInputValue;
    endTime: TimeInputValue;
  }
) {
  const start = formatTime(meta.startTime);
  const end = formatTime(meta.endTime);

  const geojson = layer.toGeoJSON() as any;
  geojson.properties = {
    ...(geojson.properties || {}),
    name: meta.name,
    color: meta.color,
    startTime: start,
    endTime: end,
  };

  (layer as any).feature = geojson;
  bindZoneTooltip(layer, meta.name, start, end);
}