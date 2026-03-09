import { useEffect } from "react";
import { useMap } from "react-leaflet";

export function SetupPanes() {
  const map = useMap();

  useEffect(() => {
    if (!map.getPane("topMarkers")) {
      const pane = map.createPane("topMarkers");
      pane.style.zIndex = "650";
      pane.style.pointerEvents = "auto";
    }
  }, [map]);

  return null;
}