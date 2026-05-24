export type RegisterPostBody = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: string;
  birth_date?: string | null;
  city?: string;
  street?: string;
  house_number?: string;
  apartment_number?: string;
  med_info?: string;
  phone_number?: string;
}

export type RegisterCreatedResponse = {
  email: string;
  detail: string;
}

export type VerifyEmailBody = {
  email: string;
  code: string;
}

export type TokenResponse = {
  refresh: string,
  access: string,
  user_id: number,
  email: string,
  role: string,
}

export type LoginPostBody = {
  email: string;
  password: string;
}

export interface Profile {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  first_name: string;
  last_name: string;
  birth_date: string;
  city?: string;
  street?: string;
  house_number?: string;
  apartment_number?: string;
  med_info?: string;
  role: string;
  is_online: boolean;
  last_seen?: string;
  identifier?: string;
  avatar?: string;
  phone_number?: string;
}

export interface AvatarUpdatePostBody {
  user_id: number;
  avatar: File;
}

export type UserShort = {
  id: number;
  email: string;
};