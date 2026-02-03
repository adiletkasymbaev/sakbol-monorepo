// @ts-nocheck
import { useEffect } from "react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { useCreateSosSignalMutation } from "../../../features/sos/sosApiSlice";
import { useSelector } from "react-redux";
import { selectUserLat, selectUserLon } from "../../../features/sos/presenceSlice";

/**
 * Хук слушает window.onHotword (например, из Android WebView)
 * и показывает тост при срабатывании голосового ключевого слова.
 */
export function useHotwordListener() {
  const [createSosSignal] = useCreateSosSignalMutation();
  const lat = useSelector(selectUserLat);
  const lon = useSelector(selectUserLon);

  useEffect(() => {
    window.onHotword = (payload) => {
      try {
        const json = JSON.stringify(payload, null, 2);
        const obj = JSON.parse(json);

        async function action() {
          await createSosSignal({ latitude: lat, longitude: lon, mode: obj?.type, service: obj?.service }).unwrap();
        }
        action()
        addToast({
          title: ToastTypes.OK,
          description: "Вы произнесли ключевое слово. Экстренный СОС-сигнал вызван.",
          color: "success",
        });
      } catch (e) {
        console.error("Ошибка при отображении тоста:", e);
      }
    };

    return () => {
      delete window.onHotword;
    };
  }, []);
}