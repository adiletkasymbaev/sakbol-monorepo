// src/features/map/MapLayer.tsx

import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import CustomMarker from "./CustomMarker";
import { useLocation } from "../../../store/useLocation";
import type { ContactLocation } from "../../../shared/types/locations";
import LocationSync from "./LocationSync";
import DrawPanel from "./DrawPanel";
import ZonesDrawBridge from "./ZonesDrawBridge";
import MapSpinner from "./MapSpinner";
import { SetupPanes } from "../../../shared/components/SetupPanes";
import MyLocationButton from "./MyLocationButton";
import { MapController } from "./MapController"; 
import type { GeolocationResult } from "../../../shared/utils/getGeolocation";

function MapLayer({ isDrawable = false }: { isDrawable?: boolean }) {
  const { contactsLocations, isLoading, geoLat, geoLon } = useLocation();

  // Обработчик успешного получения координат (для кнопки)
  const handleLocationSuccess = (result: GeolocationResult) => {
    // Можно добавить дополнительную логику, если нужно
    console.log("Location updated:", result);
  };

  return (
    <div className="relative h-screen w-full">
      {isDrawable && <DrawPanel />}
      <LocationSync intervalMs={120_000} />

      <MapContainer
        center={[40.9298182, 73.00119]}
        zoom={14}
        className="h-full w-full z-[5] relative"
        scrollWheelZoom={true}
      >
        <SetupPanes />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <MapController onLocationFound={handleLocationSuccess} />

        {/* Маркер пользователя */}
        {geoLat && geoLon && (
          <CustomMarker 
            avatar="" 
            position={[geoLat, geoLon]} 
            zIndex={9999} 
            isUser 
          />
        )}

        {isLoading && <MapSpinner />}

        {contactsLocations
          ?.filter(
            (contact: ContactLocation) =>
              contact.latitude != null && contact.longitude != null
          )
          .map((contact: ContactLocation) => (
            <CustomMarker
              key={contact.contact_id}
              avatar={contact.avatar}
              name={
                contact.first_name?.[0] && contact.last_name?.[0]
                  ? `${contact.first_name[0]}. ${contact.last_name[0]}.`
                  : contact.first_name ?? "?"
              }
              position={[contact.latitude, contact.longitude]}
            />
          ))}

        <FeatureGroup>
          <ZonesDrawBridge />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}

export default MapLayer;