import { useMapEvents } from "react-leaflet";
import { useDispatch } from "react-redux";
import { setTargetLocation } from "../../../features/sos/presenceSlice";

export default function MapSyncTarget() {
  const dispatch = useDispatch();

  useMapEvents({
    moveend: (e) => {
      const center = e.target.getCenter();
      dispatch(setTargetLocation({ lat: center.lat, lon: center.lng }));
    },
    zoomend: (e) => {
      const center = e.target.getCenter();
      dispatch(setTargetLocation({ lat: center.lat, lon: center.lng }));
    },
  });

  return null;
}