import { create } from "zustand";
import { tourService } from "../shared/services/tourService";
import type {
  TourGroup,
  TourGroupDetail,
  TourGroupStats,
  TourGroupMember,
  TourZone,
  TourZoneItem,
  TourSession,
  TourSessionDetail,
  ZoneViolation,
  MemberLocation,
} from "../shared/types/tour";

type TourState = {
  // Groups
  groups: TourGroup[];
  selectedGroup: TourGroupDetail | null;
  groupStats: TourGroupStats | null;

  // Members
  members: TourGroupMember[];
  membersLocations: MemberLocation[];

  // Zones
  zones: (TourZone | TourZoneItem)[];

  // Sessions
  sessions: TourSession[];
  activeSession: TourSessionDetail | null;
  violations: ZoneViolation[];

  // Loading states
  isGroupsLoading: boolean;
  isGroupDetailLoading: boolean;
  isMembersLoading: boolean;
  isZonesLoading: boolean;
  isSessionsLoading: boolean;
  isActionLoading: boolean;
  error: unknown | null;

  // Actions - Groups
  fetchGroups: () => Promise<void>;
  fetchGroupDetail: (id: string) => Promise<void>;
  createGroup: (name: string, description?: string) => Promise<TourGroup | null>;
  dismissGroup: (id: string) => Promise<void>;
  setSelectedGroup: (group: TourGroupDetail | null) => void;

  // Actions - Members
  fetchMembers: (groupId: string) => Promise<void>;
  fetchMembersLocations: (groupId: string) => Promise<void>;
  acceptMember: (memberId: number) => Promise<void>;
  removeMember: (memberId: number) => Promise<void>;
  leaveGroup: (memberId: number) => Promise<void>;
  joinByCode: (inviteCode: string) => Promise<TourGroupMember | null>;

  // Actions - Zones
  fetchZones: (groupId: string) => Promise<void>;
  createZone: (data: {
    group: string;
    name: string;
    polygon: Array<{ lat: number; lng: number }>;
    center_lat: number;
    center_lng: number;
    description?: string;
  }) => Promise<TourZone | null>;

  // Actions - Sessions
  fetchSessions: (groupId: string) => Promise<void>;
  createSession: (groupId: string, durationMinutes?: number) => Promise<TourSession | null>;
  startTour: (sessionId: number, durationMinutes?: number) => Promise<void>;
  completeTour: (sessionId: number) => Promise<void>;
  cancelTour: (sessionId: number) => Promise<void>;
  fetchViolations: (sessionId: number) => Promise<void>;

  // Utils
  clearError: () => void;
  clearSelectedGroup: () => void;
};

const useTour = create<TourState>((set) => ({
  // Initial state
  groups: [],
  selectedGroup: null,
  groupStats: null,
  members: [],
  membersLocations: [],
  zones: [],
  sessions: [],
  activeSession: null,
  violations: [],

  // Loading states
  isGroupsLoading: false,
  isGroupDetailLoading: false,
  isMembersLoading: false,
  isZonesLoading: false,
  isSessionsLoading: false,
  isActionLoading: false,
  error: null,

  // Actions - Groups
  fetchGroups: async () => {
    set({ isGroupsLoading: true, error: null });
    try {
      const response = await tourService.getGroups();
      set({ groups: response.data.results, isGroupsLoading: false });
    } catch (error) {
      set({ error, isGroupsLoading: false });
    }
  },

  fetchGroupDetail: async (id: string) => {
    set({ isGroupDetailLoading: true, error: null });
    try {
      const response = await tourService.getGroupDetail(id);
      set({ selectedGroup: response.data, isGroupDetailLoading: false });
    } catch (error) {
      set({ error, isGroupDetailLoading: false });
    }
  },

  createGroup: async (name, description) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.createGroup({ name, description });
      set((state) => ({
        groups: [...state.groups, response.data],
        isActionLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error, isActionLoading: false });
      return null;
    }
  },

  dismissGroup: async (id: string) => {
    set({ isActionLoading: true, error: null });
    try {
      await tourService.dismissGroup(id);
      set((state) => ({
        groups: state.groups.map((g) =>
          g.id === id ? { ...g, is_active: false } : g
        ),
        isActionLoading: false,
      }));
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  setSelectedGroup: (group) => {
    set({ selectedGroup: group });
  },

  // Actions - Members
  fetchMembers: async (groupId: string) => {
    set({ isMembersLoading: true, error: null });
    try {
      const response = await tourService.getMembers(groupId);
      // API может возвращать { results: [...] } или [...]
      const membersData = response.data;
      const membersArray = Array.isArray(membersData)
        ? membersData
        : (membersData as any).results || [];
      set({ members: membersArray, isMembersLoading: false });
    } catch (error) {
      set({ error, isMembersLoading: false });
    }
  },

  fetchMembersLocations: async (groupId: string) => {
    try {
      const response = await tourService.getGroupMembersLocations(groupId);
      set({ membersLocations: response.data });
    } catch (error) {
      console.error("Failed to fetch members locations:", error);
    }
  },

  acceptMember: async (memberId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      await tourService.acceptMember(memberId);
      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, status: "active" } : m
        ),
        isActionLoading: false,
      }));
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  removeMember: async (memberId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      await tourService.removeMember(memberId);
      set((state) => ({
        members: state.members.filter((m) => m.id !== memberId),
        isActionLoading: false,
      }));
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  leaveGroup: async (memberId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      await tourService.leaveGroup(memberId);
      set((state) => ({
        members: state.members.map((m) =>
          m.id === memberId ? { ...m, status: "left" } : m
        ),
        isActionLoading: false,
      }));
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  joinByCode: async (inviteCode: string) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.joinByCode({ invite_code: inviteCode });
      set({ isActionLoading: false });
      return response.data;
    } catch (error) {
      set({ error, isActionLoading: false });
      return null;
    }
  },

  // Actions - Zones
  fetchZones: async (groupId: string) => {
    set({ isZonesLoading: true, error: null });
    try {
      const response = await tourService.getZones(groupId);
      const zonesData = response.data;
      const zonesArray = Array.isArray(zonesData)
        ? zonesData
        : (zonesData as any).results || [];
      set({ zones: zonesArray, isZonesLoading: false });
    } catch (error) {
      set({ error, isZonesLoading: false });
    }
  },

  createZone: async (data) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.createZone(data);
      const newZone: TourZone = response.data;
      set((state) => ({
        zones: [...state.zones, newZone],
        // Обновляем зоны в selectedGroup если это та же группа
        selectedGroup: state.selectedGroup && state.selectedGroup.id === data.group
          ? { ...state.selectedGroup, zones: [...(state.selectedGroup.zones || []), newZone] }
          : state.selectedGroup,
        isActionLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error, isActionLoading: false });
      return null;
    }
  },

  // Actions - Sessions
  fetchSessions: async (groupId: string) => {
    set({ isSessionsLoading: true, error: null });
    try {
      const response = await tourService.getSessions(groupId);
      const sessionsData = response.data;
      const sessionsArray = Array.isArray(sessionsData)
        ? sessionsData
        : (sessionsData as any).results || [];
      set({ sessions: sessionsArray, isSessionsLoading: false });
    } catch (error) {
      set({ error, isSessionsLoading: false });
    }
  },

  createSession: async (groupId: string, durationMinutes?: number) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.createSession(groupId, durationMinutes);
      set((state) => ({
        sessions: [...state.sessions, response.data],
        isActionLoading: false,
      }));
      return response.data;
    } catch (error) {
      set({ error, isActionLoading: false });
      return null;
    }
  },

  startTour: async (sessionId: number, durationMinutes?: number) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.startTour(sessionId, durationMinutes);
      set({ activeSession: response.data, isActionLoading: false });
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  completeTour: async (sessionId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.completeTour(sessionId);
      set({ activeSession: response.data, isActionLoading: false });
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  cancelTour: async (sessionId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.cancelTour(sessionId);
      set({ activeSession: response.data, isActionLoading: false });
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  fetchViolations: async (sessionId: number) => {
    set({ isActionLoading: true, error: null });
    try {
      const response = await tourService.getViolations(sessionId);
      set({ violations: response.data, isActionLoading: false });
    } catch (error) {
      set({ error, isActionLoading: false });
    }
  },

  // Utils
  clearError: () => {
    set({ error: null });
  },

  clearSelectedGroup: () => {
    set({ selectedGroup: null, groupStats: null });
  },
}));

export default useTour;
