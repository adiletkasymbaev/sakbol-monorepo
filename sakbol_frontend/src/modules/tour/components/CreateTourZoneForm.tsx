import { useState, useRef, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { MapContainer, TileLayer, Polygon, useMapEvents, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { createTourZoneSchema, type CreateTourZoneFormType } from "../utils/schemas";
import { FormInput } from "../../../shared/components/FormInput";
import useTour from "../../../store/useTour";
import { nativeBridge } from "../../../shared/services/nativeBridge";
import { nativeService } from "../../../shared/services/nativeService";

interface CreateTourZoneFormProps {
  groupId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Компонент для добавления точек на карту кликом
function ClickToAddPoints({ onPointAdd }: { onPointAdd: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onPointAdd(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Компонент для центрирования карты
function MapCenterer({ position }: { position: [number, number] | null }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return null;
}

export default function CreateTourZoneForm({ groupId, onSuccess, onCancel }: CreateTourZoneFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const { createZone } = useTour();
  const mapRef = useRef<L.Map | null>(null);

  const methods = useForm<CreateTourZoneFormType>({
    resolver: zodResolver(createTourZoneSchema),
    defaultValues: {
      name: "",
      description: "",
      polygon: [],
      center_lat: 0,
      center_lng: 0,
    },
  });

  const handleAddPoint = (lat: number, lng: number) => {
    const newPoint = { lat, lng };
    const newPoints = [...polygonPoints, newPoint];
    setPolygonPoints(newPoints);
    methods.setValue("polygon", newPoints);

    // Вычисляем центр как среднее значение
    const centerLat = newPoints.reduce((sum, p) => sum + p.lat, 0) / newPoints.length;
    const centerLng = newPoints.reduce((sum, p) => sum + p.lng, 0) / newPoints.length;
    methods.setValue("center_lat", Number(centerLat.toFixed(6)));
    methods.setValue("center_lng", Number(centerLng.toFixed(6)));
  };

  const handleClearPoints = () => {
    setPolygonPoints([]);
    methods.setValue("polygon", []);
    methods.setValue("center_lat", 0);
    methods.setValue("center_lng", 0);
  };

  const handleGetUserLocation = () => {
    // Приоритет нативной геолокации из WebView
    if (nativeBridge.isNativeApp()) {
      const nativeLoc = nativeService.getLastLocation();
      if (nativeLoc) {
        const pos: [number, number] = [nativeLoc.latitude, nativeLoc.longitude];
        setUserPosition(pos);
        if (mapRef.current) {
          mapRef.current.flyTo(pos, 15);
        }
        addToast({
          title: ToastTypes.OK,
          description: "Местоположение получено из приложения",
          color: "success",
        });
        return;
      }
      addToast({
        title: ToastTypes.ERR,
        description: "Геолокация из приложения ещё не доступна",
        color: "danger",
      });
      return;
    }

    if (!navigator.geolocation) {
      addToast({
        title: ToastTypes.ERR,
        description: "Геолокация не поддерживается вашим браузером",
        color: "danger",
      });
      return;
    }

    addToast({
      title: "Геолокация",
      description: "Определяем ваше местоположение...",
      color: "primary",
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const pos: [number, number] = [latitude, longitude];
        setUserPosition(pos);

        // Центрируем карту на позиции пользователя
        if (mapRef.current) {
          mapRef.current.flyTo(pos, 15);
        }

        addToast({
          title: ToastTypes.OK,
          description: "Местоположение найдено",
          color: "success",
        });
      },
      (error) => {
        console.error("Ошибка получения геолокации:", error);
        addToast({
          title: ToastTypes.ERR,
          description: "Не удалось получить местоположение. Разрешите доступ к геолокации в настройках браузера.",
          color: "danger",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const onSubmit = async (data: CreateTourZoneFormType) => {
    if (isLoading || polygonPoints.length < 3) return;
    setIsLoading(true);

    try {
      const result = await createZone({
        group: groupId,
        name: data.name,
        description: data.description || "",
        polygon: data.polygon,
        center_lat: data.center_lat,
        center_lng: data.center_lng,
      });

      if (result) {
        addToast({
          title: ToastTypes.OK,
          description: "Зона успешно создана",
          color: "success",
        });
        onSuccess?.();
      } else {
        addToast({
          title: ToastTypes.ERR,
          description: "Не удалось создать зону",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error creating zone:", error);
      const message = error?.response?.data?.detail || error?.response?.data?.message || "Ошибка при создании зоны";
      addToast({
        title: ToastTypes.ERR,
        description: message,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-20" style={{ position: "relative", zIndex: 10 }}>
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <FormInput
            name="name"
            label="Название зоны"
            placeholder="Например: Безопасная зона"
          />

          <FormInput
            name="description"
            label="Описание (необязательно)"
            placeholder="Краткое описание зоны"
          />

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Нарисуйте зону на карте:</p>
              <Button
                type="button"
                size="sm"
                variant="bordered"
                onPress={handleGetUserLocation}
              >
                📍 Моё местоположение
              </Button>
            </div>
            <p className="text-xs text-default-500">
              Кликайте по карте, чтобы добавить точки. Минимум 3 точки.
            </p>

            <div style={{ height: "300px", width: "100%", borderRadius: "8px", overflow: "hidden", position: "relative", zIndex: 20 }}>
              <MapContainer
                center={[42.8746, 74.5698]} // Бишкек
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickToAddPoints onPointAdd={handleAddPoint} />
                <MapCenterer position={userPosition} />
                {polygonPoints.length > 0 && (
                  <Polygon
                    positions={polygonPoints.map((p) => [p.lat, p.lng] as [number, number])}
                    pathOptions={{ color: "#274193", fillColor: "#274193", fillOpacity: 0.3 }}
                  />
                )}
                {userPosition && (
                  <Marker position={userPosition}>
                    <Popup>Ваше местоположение</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="bordered"
                onPress={handleClearPoints}
                isDisabled={polygonPoints.length === 0}
              >
                Очистить точки
              </Button>
              <span className="text-sm text-default-600">
                Добавлено точек: {polygonPoints.length}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="light"
                onPress={onCancel}
                className="flex-1"
              >
                Отмена
              </Button>
            )}
            <Button
              type="submit"
              color="primary"
              isLoading={isLoading}
              isDisabled={polygonPoints.length < 3}
              className="flex-1"
            >
              Создать зону
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
