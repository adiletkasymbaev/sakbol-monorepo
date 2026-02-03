// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ВАЖНО: импортировать JS !!! ← иначе L.Control.Draw нет
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

import L from "leaflet";
import {
  selectFavoriteContacts,
  selectTargetLat,
  selectTargetLon,
  selectUserLat,
  selectUserLon,
} from "../../../features/sos/presenceSlice";
import { useSelector } from "react-redux";

import CustomMarker from "../components/CustomMarker";
import MapSyncTarget from "../components/MapSyncTarget";
import FlyToLocation from "../components/FlyToLocation";
import drawLocales from 'leaflet-draw-locales'

function DrawControls({ color }: { color: string }) {
  const map = useMap();
  const drawnItemsRef = useRef(new L.FeatureGroup());

  useEffect(() => {
    const drawnItems = drawnItemsRef.current;
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        marker: false,
        circle: false,
        circlemarker: false,
        rectangle: false,
        polyline: false,
        polygon: {
          allowIntersection: false,
          drawError: { color: "#e00", message: "Ошибка!" },
          shapeOptions: {
            color,
            fillColor: color,
            fillOpacity: 0.5,
          },
        },
      },
      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e: any) => {
      drawnItems.addLayer(e.layer);
    });

    return () => {
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, color]);

  return null;
}

function Map() {
  const [polyColor, setPolyColor] = useState("#ff0000");

  const favoriteContacts = useSelector(selectFavoriteContacts);
  const lat = useSelector(selectUserLat);
  const lon = useSelector(selectUserLon);
  const target_lat = useSelector(selectTargetLat);
  const target_lon = useSelector(selectTargetLon);
  const center: [number, number] = [target_lat, target_lon];

  drawLocales('ru')

  return (
    <div className="relative h-screen w-full">
      {/* Панель выбора цвета */}
      <div className="absolute top-32 right-3  bg-white p-2 rounded shadow z-[1000]">
        <input
          type="color"
          value={polyColor}
          onChange={(e) => setPolyColor(e.target.value)}
        />
      </div>

      <MapContainer center={center} zoom={15} className="h-full w-full z-[5]">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* ВАЖНО: FeatureGroup должен быть внутри карты, но НЕ вокруг DrawControls */}
        <FeatureGroup>
          <DrawControls color={polyColor} />
        </FeatureGroup>

        <CustomMarker avatar="" position={[lat, lon]} isUser />

        {favoriteContacts?.map((fav) => (
          <CustomMarker
            key={fav.id}
            avatar={fav?.contact?.avatar}
            position={[fav?.location?.latitude, fav?.location?.longitude]}
          />
        ))}

        <FlyToLocation />
        <MapSyncTarget />
      </MapContainer>
    </div>
  );
}

export default Map;