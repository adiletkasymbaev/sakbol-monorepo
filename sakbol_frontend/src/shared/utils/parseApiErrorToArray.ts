import axios from "axios";

/**
 * Нормализует ошибки с Django REST Framework в массив строк
 * @param error - объект ошибки (axios или любая ошибка)
 * @returns массив строк с сообщениями
 */
export function parseApiErrorToArray(error: unknown): string[] {
  if (axios.isAxiosError(error)) {
    const response = error.response?.data;

    if (!response) {
      return ["Сервер не отвечает"];
    }

    if (response.detail) {
      return [response.detail];
    }

    const messages: string[] = [];
    for (const key in response) {
      const val = response[key];
      if (Array.isArray(val)) {
        messages.push(...val);
      } else if (typeof val === "string") {
        messages.push(val);
      } else if (typeof val === "object" && val !== null) {
        // вложенные объекты ошибок (например nested serializer)
        for (const nestedKey in val) {
          const nestedVal = val[nestedKey];
          if (Array.isArray(nestedVal)) {
            messages.push(...nestedVal);
          } else if (typeof nestedVal === "string") {
            messages.push(nestedVal);
          }
        }
      }
    }

    return messages.length > 0 ? messages : ["Неизвестная ошибка"];
  }

  // Любая другая ошибка
  return [(error as Error)?.message || "Неизвестная ошибка"];
}