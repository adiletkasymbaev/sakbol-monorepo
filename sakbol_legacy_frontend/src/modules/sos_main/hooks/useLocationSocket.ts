// useLocationSocket.ts
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { updateFavoriteLocationByUserId, updateFavoritePresenceByUserId } from "../../../features/sos/presenceSlice"

/**
 * Подключается к WS (?token=...), слушает события и обновляет favoriteContacts.
 */
export function useLocationSocket(wsBaseUrl: string, token?: string | null) {
  const dispatch = useDispatch();
  const socketRef = useRef<WebSocket | null>(null);
  const didInitRef = useRef(false); // защита от двойного эффекта в StrictMode

  useEffect(() => {
    if (!wsBaseUrl || !token) return;
    if (didInitRef.current) return;
    didInitRef.current = true;

    const url = wsBaseUrl.includes("?")
      ? `${wsBaseUrl}&token=${encodeURIComponent(token)}`
      : `${wsBaseUrl}?token=${encodeURIComponent(token)}`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);

        // с типом
        if (data.type === "location.update") {
          const { from_user_id, latitude, longitude, updated_at } = data;
          if (Number.isFinite(latitude) && Number.isFinite(longitude) && from_user_id) {
            dispatch(
              updateFavoriteLocationByUserId({
                userId: Number(from_user_id),
                latitude: Number(latitude),
                longitude: Number(longitude),
                updated_at,
              })
            );
          }
          return;
        }
        if (data.type === "presence.update") {
          const { user_id, is_online, last_seen } = data;
          if (typeof is_online !== "undefined" && user_id) {
            dispatch(
              updateFavoritePresenceByUserId({
                userId: Number(user_id),
                is_online: Boolean(is_online),
                last_seen: last_seen ?? null,
              })
            );
          }
          return;
        }

        // без типа — определяем по полям
        if (data.from_user_id && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
          dispatch(
            updateFavoriteLocationByUserId({
              userId: Number(data.from_user_id),
              latitude: Number(data.latitude),
              longitude: Number(data.longitude),
              updated_at: data.updated_at,
            })
          );
          return;
        }
        if (data.user_id && typeof data.is_online !== "undefined") {
          dispatch(
            updateFavoritePresenceByUserId({
              userId: Number(data.user_id),
              is_online: Boolean(data.is_online),
              last_seen: data.last_seen ?? null,
            })
          );
          return;
        }
      } catch (e) {
        console.error("WS message parse error:", e);
      }
    };

    ws.onerror = (e) => console.error("WS error:", e);

    return () => {
      ws.close(1000, "unmount");
      socketRef.current = null;
      didInitRef.current = false;
    };
  }, [wsBaseUrl, token, dispatch]);
}