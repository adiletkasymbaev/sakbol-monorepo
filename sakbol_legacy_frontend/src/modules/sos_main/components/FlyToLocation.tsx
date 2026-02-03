// @ts-nocheck
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { useSelector } from "react-redux";
import { selectTargetLat, selectTargetLon } from "../../../features/sos/presenceSlice";

function FlyToLocation() {
    const map = useMap();
    const target_lat = useSelector(selectTargetLat);
    const target_lon = useSelector(selectTargetLon);

    useEffect(() => {
        map.flyTo([target_lat, target_lon], map.getZoom(), { duration: 1.5 });
        console.log(target_lat, target_lon)
    }, [target_lat, target_lon, map]);

    return null
}

export default FlyToLocation;