import { DEFAULT_ZONE_NAME } from "./consts";

export function getZoneName(name: string) {
  return name.trim() || DEFAULT_ZONE_NAME;
}