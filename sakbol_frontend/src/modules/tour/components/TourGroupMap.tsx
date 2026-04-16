import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polygon, useMap, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import L from "leaflet";
import type { TourZone, TourZoneItem, MemberLocation } from "../../../shared/types/tour";
import useTour from "../../../store/useTour";

interface TourGroupMapProps {
  zones: (TourZone | TourZoneItem)[];
  groupId: string;
  showMembers?: boolean;
}

// Fix для иконок Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Компонент для центрирования карты
function MapCenterer({ zones }: { zones: (TourZone | TourZoneItem)[] }) {
  const map = useMap();

  useEffect(() => {
    if (zones.length > 0 && 'polygon' in zones[0] && (zones[0] as TourZone).polygon.length > 0) {
      const firstZone = zones[0] as TourZone;
      const lat = firstZone.center_lat || firstZone.polygon[0].lat;
      const lng = firstZone.center_lng || firstZone.polygon[0].lng;
      map.setView([Number(lat), Number(lng)], 13);
    }
  }, [zones, map]);

  return null;
}

// Компонент для обновления местоположений участников
function MembersLocationsWatcher({ groupId }: { groupId: string }) {
  const { fetchMembersLocations } = useTour();

  useEffect(() => {
    fetchMembersLocations(groupId);

    // Обновляем местоположения каждые 30 секунд
    const interval = setInterval(() => {
      fetchMembersLocations(groupId);
    }, 30000);

    return () => clearInterval(interval);
  }, [groupId]);

  return null;
}

// Создание кастомной иконки для участников
function createMemberIcon(isOnline: boolean) {
  return L.divIcon({
    className: 'member-marker',
    html: `
      <div style="
        background: ${isOnline ? '#4CAF50' : '#9E9E9E'};
        border: 2px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        👤
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

export default function TourGroupMap({ zones, groupId, showMembers = true }: TourGroupMapProps) {
  const mapRef = useRef<L.Map>(null);
  const { membersLocations } = useTour();

  // Дефолтные координаты (Бишкек)
  const defaultPosition: [number, number] = [42.8746, 74.5698];

  // Получаем центр первой зоны или дефолтные координаты
  const centerPosition: [number, number] =
    zones.length > 0 && 'polygon' in zones[0] && (zones[0] as TourZone).polygon.length > 0
      ? [Number((zones[0] as TourZone).center_lat) || (zones[0] as TourZone).polygon[0].lat,
         Number((zones[0] as TourZone).center_lng) || (zones[0] as TourZone).polygon[0].lng]
      : defaultPosition;

  // Цвета для зон
  const zoneColors = [
    "#274193", // primary blue
    "#F39DAA", // secondary pink
    "#4CAF50", // green
    "#FF9800", // orange
    "#9C27B0", // purple
  ];

  return (
    <div style={{ height: "400px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative", zIndex: 1 }}>
      <MapContainer
        center={centerPosition}
        zoom={13}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterer zones={zones} />
        
        {showMembers && (
          <MembersLocationsWatcher groupId={groupId} />
        )}

        {/* Рендеринг зон */}
        {zones.map((zone, index) => {
          // Зоны из detail могут не иметь polygon (TourZoneItem)
          if (!('polygon' in zone) || !(zone as TourZone).polygon || (zone as TourZone).polygon.length === 0) {
            return null; // Пропускаем зоны без полигона
          }

          const color = zoneColors[index % zoneColors.length];
          const positions: [number, number][] = (zone as TourZone).polygon.map(
            (p) => [p.lat, p.lng] as [number, number]
          );

          return (
            <Polygon
              key={zone.id}
              positions={positions}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2,
              }}
              eventHandlers={{
                mouseover: (e) => {
                  const target = e.target as L.Path;
                  target.setStyle({ fillOpacity: 0.5 });
                },
                mouseout: (e) => {
                  const target = e.target as L.Path;
                  target.setStyle({ fillOpacity: 0.3 });
                },
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{zone.name}</h3>
                  {zone.description && (
                    <p className="text-sm text-gray-600">{zone.description}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {zone.is_active ? "✅ Активна" : "❌ Не активна"}
                  </p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Рендеринг маркеров участников */}
        {showMembers && membersLocations.map((member) => (
          <Marker
            key={member.member_id}
            position={[member.latitude, member.longitude]}
            icon={createMemberIcon(member.is_online)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">
                  {member.first_name} {member.last_name}
                </h3>
                <p className="text-sm text-gray-600">{member.email}</p>
                <p className="text-xs mt-1">
                  {member.is_online ? (
                    <span className="text-green-600">🟢 Онлайн</span>
                  ) : (
                    <span className="text-gray-500">
                      ⏰ {member.last_seen ? new Date(member.last_seen).toLocaleString() : 'Неизвестно'}
                    </span>
                  )}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
