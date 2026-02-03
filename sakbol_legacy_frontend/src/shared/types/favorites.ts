import type { IUser } from "./user";

// Тип одного избранного контакта
export interface FavoriteContact {
  location: Location;
  id: number
  contact: IUser
}

// Тип ответа от API со списком избранных контактов
export interface FavoriteContactsResponse {
  count: number
  next: string | null
  previous: string | null
  results: FavoriteContact[]
}