import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useLocation } from "../../../store/useLocation";

function FlyToLocation() {
    const map = useMap();
    const {displayLat, displayLon} = useLocation()

    useEffect(() => {
        map.flyTo([displayLat, displayLon], map.getZoom(), { duration: 1.5 });
    }, [displayLat, displayLon, map]);

    return null
}

export default FlyToLocation;