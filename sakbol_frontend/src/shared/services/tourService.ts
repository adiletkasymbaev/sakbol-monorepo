import api from "./axios";
import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type {
  TourGroup,
  TourGroupDetail,
  TourGroupStats,
  TourGroupMember,
  TourZone,
  TourSession,
  TourSessionDetail,
  ZoneViolation,
  CreateTourGroupRequest,
  CreateTourZoneRequest,
  UpdateTourLocationRequest,
  JoinGroupByCodeRequest,
  TourGroupInviteInfo,
  MemberLocation,
} from "../types/tour";

export const tourService = {
  // ========== Groups ==========
  getGroups: () => {
    return api.get<{ results: TourGroup[] }>(API_ENDPOINTS.TOUR.GROUPS);
  },

  getGroupDetail: (id: string) => {
    return api.get<TourGroupDetail>(API_ENDPOINTS.TOUR.GROUP_BY_ID(id));
  },

  getGroupMembersLocations: (id: string) => {
    return api.get<MemberLocation[]>(`${API_ENDPOINTS.TOUR.GROUP_BY_ID(id)}members_locations/`);
  },

  createGroup: (data: CreateTourGroupRequest) => {
    return api.post<TourGroup>(API_ENDPOINTS.TOUR.GROUPS, data);
  },

  updateGroup: (id: string, data: Partial<CreateTourGroupRequest>) => {
    return api.patch<TourGroup>(API_ENDPOINTS.TOUR.GROUP_BY_ID(id), data);
  },

  deleteGroup: (id: string) => {
    return api.delete(API_ENDPOINTS.TOUR.GROUP_BY_ID(id));
  },

  dismissGroup: (id: string) => {
    return api.post<{ status: string }>(API_ENDPOINTS.TOUR.GROUP_DISMISS(id));
  },

  getGroupStats: (id: string) => {
    return api.get<TourGroupStats>(API_ENDPOINTS.TOUR.GROUP_STATS(id));
  },

  // ========== Members ==========
  getMembers: (groupId: string) => {
    return api.get<TourGroupMember[]>(`${API_ENDPOINTS.TOUR.MEMBERS}?group=${groupId}`);
  },

  addMember: (userId: number, groupId: string) => {
    return api.post<TourGroupMember>(API_ENDPOINTS.TOUR.MEMBERS, {
      user_id: userId,
      group: groupId,
    });
  },

  acceptMember: (memberId: number) => {
    return api.post<{ status: string }>(API_ENDPOINTS.TOUR.MEMBER_ACCEPT(memberId));
  },

  removeMember: (memberId: number) => {
    return api.post<{ status: string }>(API_ENDPOINTS.TOUR.MEMBER_REMOVE(memberId));
  },

  leaveGroup: (memberId: number) => {
    return api.post<{ status: string }>(API_ENDPOINTS.TOUR.MEMBER_LEAVE(memberId));
  },

  joinByCode: (data: JoinGroupByCodeRequest) => {
    return api.post<TourGroupMember>(API_ENDPOINTS.TOUR.MEMBER_JOIN_BY_CODE, data);
  },

  // ========== Zones ==========
  getZones: (groupId: string) => {
    return api.get<TourZone[]>(`${API_ENDPOINTS.TOUR.ZONES}?group=${groupId}`);
  },

  createZone: (data: CreateTourZoneRequest) => {
    return api.post<TourZone>(API_ENDPOINTS.TOUR.ZONES, data);
  },

  updateZone: (id: number, data: Partial<CreateTourZoneRequest>) => {
    return api.patch<TourZone>(API_ENDPOINTS.TOUR.ZONE_BY_ID(id), data);
  },

  deleteZone: (id: number) => {
    return api.delete(API_ENDPOINTS.TOUR.ZONE_BY_ID(id));
  },

  // ========== Sessions ==========
  getSessions: (groupId: string) => {
    return api.get<TourSession[]>(`${API_ENDPOINTS.TOUR.SESSIONS}?group=${groupId}`);
  },

  getSessionDetail: (id: number) => {
    return api.get<TourSessionDetail>(API_ENDPOINTS.TOUR.SESSION_BY_ID(id));
  },

  createSession: (groupId: string, durationMinutes?: number) => {
    return api.post<TourSession>(API_ENDPOINTS.TOUR.SESSIONS, {
      group: groupId,
      duration_minutes: durationMinutes || 60,
    });
  },

  startTour: (sessionId: number, durationMinutes?: number) => {
    return api.post<TourSessionDetail>(API_ENDPOINTS.TOUR.SESSION_START(sessionId), {
      duration_minutes: durationMinutes,
    });
  },

  completeTour: (sessionId: number) => {
    return api.post<TourSessionDetail>(API_ENDPOINTS.TOUR.SESSION_COMPLETE(sessionId));
  },

  cancelTour: (sessionId: number) => {
    return api.post<TourSessionDetail>(API_ENDPOINTS.TOUR.SESSION_CANCEL(sessionId));
  },

  getViolations: (sessionId: number) => {
    return api.get<ZoneViolation[]>(API_ENDPOINTS.TOUR.SESSION_VIOLATIONS(sessionId));
  },

  // ========== Location ==========
  updateLocation: (data: UpdateTourLocationRequest) => {
    return api.post<{ status: string }>(API_ENDPOINTS.TOUR.LOCATION_UPDATE, data);
  },

  // ========== Invite ==========
  getInviteInfo: (code: string) => {
    return api.get<TourGroupInviteInfo>(API_ENDPOINTS.TOUR.INVITE(code));
  },
};
