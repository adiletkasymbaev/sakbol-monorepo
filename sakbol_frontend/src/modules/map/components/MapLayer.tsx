// src/features/map/MapLayer.tsx

import { FeatureGroup, MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import { useLocation } from "../../../store/useLocation";
import type { ContactLocation } from "../../../shared/types/locations";
import type { MemberLocation, TourZone } from "../../../shared/types/tour";
import LocationSync from "./LocationSync";
import DrawPanel from "./DrawPanel";
import ZonesDrawBridge from "./ZonesDrawBridge";
import MapSpinner from "./MapSpinner";
import { SetupPanes } from "../../../shared/components/SetupPanes";
import { MapController } from "./MapController";
import type { GeolocationResult } from "../../../shared/utils/getGeolocation";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

// ── Marker icons ────────────────────────────────────────────────────────────

/** "Вы" — current user's position */
function createUserIcon() {
    return L.divIcon({
        className: "",
        html: `
          <div style="
            position: relative;
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <!-- pulse ring -->
            <div style="
              position: absolute;
              inset: 0;
              border-radius: 50%;
              background: rgba(39,65,147,0.18);
              animation: pulse-ring 1.6s ease-out infinite;
            "></div>
            <!-- dot -->
            <div style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background: #274193;
              border: 3px solid white;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 11px;
              font-weight: 700;
              color: white;
              box-shadow: 0 2px 8px rgba(39,65,147,0.45);
              position: relative;
              z-index: 1;
            ">Вы</div>
          </div>
          <style>
            @keyframes pulse-ring {
              0%   { transform: scale(0.6); opacity: 0.9; }
              100% { transform: scale(1.6); opacity: 0; }
            }
          </style>
        `,
        iconSize: [50, 50],
        iconAnchor: [25, 25],
        popupAnchor: [0, -25],
    });
}

/** Contact marker — avatar photo or coloured initials circle */
function createContactIcon(avatar: string | null, initials: string) {
    const colors = ["#9C27B0", "#E91E63", "#00BCD4", "#FF5722", "#009688"];
    // deterministic color from initials
    const color = colors[(initials.charCodeAt(0) || 0) % colors.length];

    const inner = avatar
        ? `<img src="${avatar}" alt="" style="
            width: 100%; height: 100%;
            object-fit: cover;
            border-radius: 50%;
          "/>`
        : `<span style="
            font-size: 13px;
            font-weight: 700;
            color: white;
            user-select: none;
          ">${initials || "?"}</span>`;

    return L.divIcon({
        className: "",
        html: `<div style="
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: ${avatar ? "transparent" : color};
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: 0 2px 6px rgba(0,0,0,0.30);
          ">${inner}</div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
}

/** Tour member (tourist) */
function createMemberIcon(isOnline: boolean) {
    return L.divIcon({
        className: "",
        html: `<div style="
            background: ${isOnline ? "#4CAF50" : "#9E9E9E"};
            border: 3px solid white;
            border-radius: 50%;
            width: 34px;
            height: 34px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        ">👤</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -17],
    });
}

/** Tour agent */
function createAgentIcon(isOnline: boolean) {
    return L.divIcon({
        className: "",
        html: `<div style="
            background: ${isOnline ? "#274193" : "#5a6a9a"};
            border: 3px solid white;
            border-radius: 50%;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 2px 8px rgba(39,65,147,0.5);
        ">🎯</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -19],
    });
}

// ── Component ────────────────────────────────────────────────────────────────

type MapLayerProps = {
    isDrawable?: boolean;
    /** When provided, renders group member markers instead of general contacts */
    memberLocations?: MemberLocation[];
    /** Tour zones to render as polygons on the map */
    tourZones?: TourZone[];
};

function MapLayer({ isDrawable = false, memberLocations, tourZones }: MapLayerProps) {
    const { contactsLocations, isLoading, geoLat, geoLon } = useLocation();
    const userRole = useAuth((state) => state.userRole);

    const handleLocationSuccess = (_result: GeolocationResult) => {};

    // Decide which set of markers to show
    const showMembers = memberLocations && memberLocations.length > 0;
    const hideDrawTools = userRole === ProfileRoles.TOURIST || userRole === ProfileRoles.TOUR_AGENCY;

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

                {/* My own location marker */}
                {geoLat && geoLon && (
                    <Marker
                        position={[geoLat, geoLon]}
                        icon={createUserIcon()}
                        zIndexOffset={9999}
                    >
                        <Popup>
                            <p className="font-semibold text-sm">Вы здесь</p>
                        </Popup>
                    </Marker>
                )}

                {isLoading && <MapSpinner />}

                {/* Group members + agent — shown when in tour context */}
                {showMembers && memberLocations
                    .filter(m => m.latitude != null && m.longitude != null)
                    .map(member => (
                        <Marker
                            key={`${member.is_agent ? "agent" : "member"}-${member.user_id}`}
                            position={[member.latitude, member.longitude]}
                            icon={member.is_agent ? createAgentIcon(member.is_online) : createMemberIcon(member.is_online)}
                        >
                            <Popup>
                                <div className="p-2">
                                    <p className="font-semibold">
                                        {member.is_agent && <span className="text-blue-600 mr-1">🎯</span>}
                                        {member.first_name} {member.last_name}
                                        {member.is_agent && <span className="text-xs text-blue-500 ml-1">(Агент)</span>}
                                    </p>
                                    <p className="text-sm text-gray-500">{member.email}</p>
                                    {member.is_agent && member.phone_number && (
                                        <p className="text-sm text-blue-600 font-medium mt-1">📞 {member.phone_number}</p>
                                    )}
                                    <p className="text-xs mt-1">
                                        {member.is_online
                                            ? <span className="text-green-600">🟢 Онлайн</span>
                                            : <span className="text-gray-400">
                                                ⏰ {member.last_seen
                                                    ? new Date(member.last_seen).toLocaleString()
                                                    : "Неизвестно"}
                                              </span>
                                        }
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    ))
                }

                {/* General contacts — shown when NOT in tour context */}
                {!showMembers && contactsLocations
                    ?.filter(
                        (contact: ContactLocation) =>
                            contact.latitude != null && contact.longitude != null
                    )
                    .map((contact: ContactLocation) => {
                        const initials = contact.first_name?.[0] && contact.last_name?.[0]
                            ? `${contact.first_name[0]}${contact.last_name[0]}`
                            : (contact.first_name?.[0] ?? "?");
                        return (
                            <Marker
                                key={contact.contact_id}
                                position={[contact.latitude, contact.longitude]}
                                icon={createContactIcon(contact.avatar, initials)}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <p className="font-semibold">
                                            {contact.first_name} {contact.last_name}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}

                {!hideDrawTools && (
                    <FeatureGroup>
                        <ZonesDrawBridge />
                    </FeatureGroup>
                )}

                {/* Tour zones (for agent and tourists in a group) */}
                {tourZones && tourZones.length > 0 && tourZones.map((zone, index) => {
                    if (!zone.polygon || zone.polygon.length < 3) return null;
                    const colors = ["#274193", "#F39DAA", "#4CAF50", "#FF9800", "#9C27B0"];
                    const color = colors[index % colors.length];
                    const positions: [number, number][] = zone.polygon.map(p => [p.lat, p.lng]);
                    return (
                        <Polygon
                            key={zone.id}
                            positions={positions}
                            pathOptions={{ color, fillColor: color, fillOpacity: 0.25, weight: 2 }}
                        >
                            <Popup>
                                <div className="p-1">
                                    <p className="font-semibold">{zone.name}</p>
                                    {zone.description && <p className="text-sm text-gray-500">{zone.description}</p>}
                                </div>
                            </Popup>
                        </Polygon>
                    );
                })}
            </MapContainer>
        </div>
    );
}

export default MapLayer;