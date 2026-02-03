import { Marker } from "react-leaflet";
import L from "leaflet";

interface ComponentProps {
  position: [number, number];
  avatar?: string;
  isUser?: boolean;
}

function CustomMarker({ position, avatar = "", isUser = false }: ComponentProps) {
  // Текст, если нет аватарки
  const fallbackText = isUser ? "Вы" : "Нет фото";

  const icon = L.divIcon({
    className: "custom-marker",
    html: `
      <div style="position: relative; width: 81px; height: 93px;">
        <div
          style="
            position: absolute;
            top: -72px;
            left: 10%;
            transform: translateX(-50%);
            z-index: 9999;
            width: 63px;
            height: 63px;
            overflow: hidden;
            border-radius: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
          "
        >
          ${
            avatar?.length > 0
              ? `<img src="${avatar}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover;">`
              : `<div style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 18px; line-height: 1.0; text-align: center; ${isUser ? 'color: #fff;' : 'color: #000;'}">${fallbackText}</div>`
          }
        </div>
        <img
          src="images/marker.png"
          alt="Marker"
          style="position: absolute; top: -80px; left: -32px; z-index: 9998; ${isUser ? 'filter: brightness(0) saturate(100%) invert(68%) sepia(70%) saturate(332%) hue-rotate(306deg) brightness(96%) contrast(99%);' : ''}"
        >
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return <Marker position={position} icon={icon} />;
}

export default CustomMarker;