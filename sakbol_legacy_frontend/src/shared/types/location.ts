import type { IUser } from "./user"

export interface Location {
    latitude: number
    longitude: number
    updated_at: string
    user: IUser
}