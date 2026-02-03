// @ts-nocheck
import { Button } from "@heroui/react";
import IconMapPin from "../../../shared/icons/IconMapPin";
import { useDispatch, useSelector } from "react-redux";
import { selectUserLat, selectUserLon, setTargetLocation } from "../../../features/sos/presenceSlice";

function MyLocationButton() {
  const dispatch = useDispatch();
  const lat = useSelector(selectUserLat);
  const lon = useSelector(selectUserLon);

  const handleMyLocation = () => {
    dispatch(setTargetLocation({ lat, lon }));
  };

  return (
    <Button
      onPress={handleMyLocation}
      isIconOnly
      className="size-14 bg-primary rounded-full shadow-2xl absolute -top-16 left-2"
    >
      <IconMapPin className="text-secondary" />
    </Button>
  );
}

export default MyLocationButton;