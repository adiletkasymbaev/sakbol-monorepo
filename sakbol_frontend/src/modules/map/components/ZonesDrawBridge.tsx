import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useZonesStore } from "../hooks/useZonesStore";

export default function ZonesDrawBridge() {
  const map = useMap();
  const initOnMap = useZonesStore((s) => s.initOnMap);
  const destroyFromMap = useZonesStore((s) => s.destroyFromMap);

  useEffect(() => {
    initOnMap(map);
    return () => destroyFromMap(map);
  }, [map, initOnMap, destroyFromMap]);

  return null;
}