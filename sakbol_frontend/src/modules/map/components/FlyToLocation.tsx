import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useLocation } from "../../../store/useLocation";

function FlyToLocation() {
  const map = useMap();
  const { geoLat, geoLon } = useLocation((s) => ({
    geoLat: s.geoLat,
    geoLon: s.geoLon,
  }));

  useEffect(() => {
    if (geoLat != null && geoLon != null) {
      map.flyTo([geoLat, geoLon], map.getZoom(), {
        animate: true,
        duration: 1.5,
      });
    }
  }, [geoLat, geoLon, map]);

  return null;
}

export default FlyToLocation;