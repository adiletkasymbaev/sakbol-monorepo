export interface Contact {
  id: number;
  from_user: number;
  to_user: number;
  is_accepted: boolean;
  created_at: string;
}