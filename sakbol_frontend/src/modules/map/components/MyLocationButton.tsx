// src/features/location/MyLocationButton.tsx

import { Button } from "@heroui/react";
import { useState } from "react";
import IconMapPin from "../../../shared/icons/IconMapPin";
import { useGeolocationUpdate } from "../hooks/useGeolocationUpdate";
import type { GeolocationOptions, GeolocationResult } from "../../../shared/utils/getGeolocation";

interface Props {
  onSuccess?: (result: GeolocationResult) => void;
  options?: GeolocationOptions;
}

function MyLocationButton({ onSuccess, options }: Props) {
  const { updateGeolocation } = useGeolocationUpdate();
  const [loading, setLoading] = useState(false);

  const handleMyLocation = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await updateGeolocation(options);
      if (result.success && result.data && onSuccess) {
        onSuccess(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onPress={handleMyLocation}
      isIconOnly
      isLoading={loading}
      className="size-14 bg-primary rounded-full shadow-2xl"
      aria-label="Показать моё местоположение"
    >
      <IconMapPin className="text-secondary" />
    </Button>
  );
}

export default MyLocationButton;