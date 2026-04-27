import { useMapEvents } from "react-leaflet";
import { useDispatch } from "react-redux";
import { setTargetLocation } from "../../../features/sos/presenceSlice";

export default function MapSyncTarget() {
  const dispatch = useDispatch();

  useMapEvents({
    moveend: (e: { target: { getCenter: () => { lat: number; lng: number } } }) => {
      const center = e.target.getCenter();
      dispatch(setTargetLocation({ lat: center.lat, lon: center.lng }));
    },
    zoomend: (e: { target: { getCenter: () => { lat: number; lng: number } } }) => {
      const center = e.target.getCenter();
      dispatch(setTargetLocation({ lat: center.lat, lon: center.lng }));
    },
  });

  return null;
}
