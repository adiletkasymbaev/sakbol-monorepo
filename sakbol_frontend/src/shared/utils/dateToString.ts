import { getLocalTimeZone, type DateValue } from "@internationalized/date";

export function dateToString(value: DateValue): string {
    return value
        .toDate(getLocalTimeZone())
        .toISOString()
        .split("T")[0];
}