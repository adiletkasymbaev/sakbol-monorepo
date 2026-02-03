export interface IUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  phone_number: string
  role: string
  is_online: boolean
  last_seen: string
  last_seen_display: string
  avatar: string
}

export interface RefreshData {
  access: string;
  refresh: string;
}