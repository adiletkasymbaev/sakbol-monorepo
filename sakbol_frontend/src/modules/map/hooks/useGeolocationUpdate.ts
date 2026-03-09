import { addToast } from "@heroui/react";
import { useCallback } from "react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { 
  type GeolocationOptions, 
  type GeolocationResult, 
  getGeolocation 
} from "../../../shared/utils/getGeolocation";
import { useLocation } from "../../../store/useLocation";

export function useGeolocationUpdate() {
  const setGeoLocation = useLocation((s) => s.setGeoLocation);
  const setDisplayLocation = useLocation((s) => s.setDisplayLocation);
  const updateMyLocation = useLocation((s) => s.updateMyLocation);

  const update = useCallback(
    async (options?: GeolocationOptions): Promise<{ success: boolean; data?: GeolocationResult }> => {
      return new Promise((resolve) => {
        getGeolocation(
          {
            onSuccess: async (result) => {
              setGeoLocation(result.latitude, result.longitude);
              setDisplayLocation(result.latitude, result.longitude);
              await updateMyLocation(result.latitude, result.longitude);
              
              resolve({ success: true, data: result });
            },
            onError: (error) => {
              if (error.code !== 1) {
                addToast({
                  title: ToastTypes.ERR,
                  description: error.message,
                  color: "danger",
                });
              }
              resolve({ success: false });
            },
          },
          options
        );
      });
    },
    [setGeoLocation, updateMyLocation]
  );

  return { updateGeolocation: update };
}