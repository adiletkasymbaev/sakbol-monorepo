import type { Profile, UserShort } from "./auth";

export type addContactBody = {
    identifier: string;
}

export type Contact = {
  id: number;
  from_user: UserShort;
  from_profile: Partial<Profile>;
  to_user: UserShort;
  to_profile: Partial<Profile>;
  is_accepted: boolean;
  created_at: string;
};