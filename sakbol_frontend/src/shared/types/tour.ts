import type { Profile } from './auth';

// Статусы группы и участников
export type TourGroupStatus = 'active' | 'inactive';
export type MemberStatus = 'pending' | 'active' | 'left' | 'removed';
export type TourStatus = 'draft' | 'active' | 'completed' | 'cancelled';

// Группа туристов
export interface TourGroup {
  id: string;
  agent: Profile;
  name: string;
  description: string;
  invite_code: string;
  invite_link: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_members_count: number;
  pending_members_count: number;
  zones_count: number;
  has_active_session: boolean;
}

// Детали группы
export interface TourGroupDetail extends TourGroup {
  members: TourGroupMemberItem[];
  zones: TourZone[];
  active_session: TourSession | null;
}

// Участник группы (для списка)
export interface TourGroupMemberItem {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    identifier: string | null;
    avatar: string | null;
    phone_number: string | null;
    is_online: boolean;
    last_seen: string | null;
  };
  status: MemberStatus;
  joined_at: string;
  left_at: string | null;
}

// Участник группы (полная модель - как приходит от API при GET /tour/members/)
export interface TourGroupMember {
  id: number;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    identifier: string | null;
    avatar: string | null;
  };
  status: MemberStatus;
  joined_at: string;
  left_at: string | null;
}

// Зона тура (для списка)
export interface TourZoneItem {
  id: number;
  name: string;
  description: string;
  polygon?: Array<{ lat: number; lng: number }>;
  center_lat?: number;
  center_lng?: number;
  is_active: boolean;
  created_at: string;
}

// Зона тура (полная модель)
export interface TourZone {
  id: number;
  group: string;
  name: string;
  description: string;
  polygon: Array<{ lat: number; lng: number }>;
  center_lat: number;
  center_lng: number;
  is_active: boolean;
  created_at: string;
}

// Сессия тура (для списка)
export interface TourSession {
  id: number;
  group: string;
  group_name: string;
  status: TourStatus;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number;
  created_at: string;
  elapsed_minutes: number;
  remaining_minutes: number;
}

// Сессия тура (детали)
export interface TourSessionDetail extends TourSession {
  zones: TourZoneItem[];
  members_count: number;
  violations_count: number;
}

// Нарушение зоны
export interface ZoneViolation {
  id: number;
  session: number;
  member: number;
  member_name: string;
  zone: number;
  zone_name: string;
  latitude: number;
  longitude: number;
  notified_at: string;
  is_resolved: boolean;
}

// Статистика группы
export interface TourGroupStats {
  total_members: number;
  active_members: number;
  pending_members: number;
  total_zones: number;
  active_zones: number;
  total_sessions: number;
  active_sessions: number;
  total_violations: number;
  unresolved_violations: number;
}

// Запрос: вступление в группу по коду
export interface JoinGroupByCodeRequest {
  invite_code: string;
}

// Запрос: создание группы
export interface CreateTourGroupRequest {
  name: string;
  description?: string;
}

// Запрос: создание зоны
export interface CreateTourZoneRequest {
  group: string;
  name: string;
  description?: string;
  polygon: Array<{ lat: number; lng: number }>;
  center_lat: number;
  center_lng: number;
}

// Запрос: начало тура
export interface StartTourRequest {
  duration_minutes?: number;
}

// Запрос: обновление местоположения
export interface UpdateTourLocationRequest {
  latitude: number;
  longitude: number;
}

// Местоположение участника группы
export interface MemberLocation {
  member_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  latitude: number;
  longitude: number;
  is_online: boolean;
  last_seen: string | null;
  is_agent?: boolean;
  phone_number?: string | null;
}

// Информация о группе для вступления (публичная)
export interface TourGroupInviteInfo {
  id: string;
  agent: Profile;
  name: string;
  description: string;
  invite_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  members: TourGroupMemberItem[];
  zones: TourZoneItem[];
  active_session: TourSession | null;
}
