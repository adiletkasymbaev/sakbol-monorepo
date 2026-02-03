import L from "leaflet";

export function createDrawControl(color: string, featureGroup: L.FeatureGroup) {
  return new L.Control.Draw({
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
    edit: { featureGroup },
  });
}