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

function MapLayer({ isDrawable = false }: { isDrawable?: boolean }) {
  const { contactsLocations, isLoading } = useLocation();

  return (
    <div className="relative h-screen w-full">
      {isDrawable && <DrawPanel />}

      <LocationSync intervalMs={120_000} />

      <MapContainer
        center={[40.9298182, 73.00119]}
        zoom={14}
        className="h-full w-full z-[5] relative"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <CustomMarker avatar="" position={[40.9298182, 73.00119]} isUser />

        {isLoading && <MapSpinner/>}

        {contactsLocations?.map((contact: ContactLocation) => (
          <CustomMarker
            key={contact.contact_id}
            avatar={contact.avatar}
            name={`${contact.first_name[0]}. ${contact.last_name[0]}.`}
            position={[contact.latitude, contact.longitude]}
          />
        ))}

        {isDrawable && (
          <FeatureGroup>
            <ZonesDrawBridge />
          </FeatureGroup>
        )}
      </MapContainer>
    </div>
  );
}

export default MapLayer;