export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/accounts/register/",
    VERIFY_EMAIL: "/accounts/verify-email/",
    LOGIN: "/accounts/login/",
    REFRESH: "/accounts/refresh/",
  },

  PROFILE: {
    ME: "/accounts/profile/me/",
    AVATAR: "/accounts/profile/avatar/",
  },

  SECURITY: {
    PASSWORD_REQ: "/accounts/password/change/request/",
    PASSWORD_VERIFY: "/accounts/password/change/verify/",
    EMAIL_REQ: "/accounts/email/change/request/",
    EMAIL_VERIFY: "/accounts/email/change/verify/",
  },

  CONTACTS: {
    ADD: "/general/contacts_module/contacts/",
    PENDING: "/general/contacts_module/contacts/?status=pending",
    ACCEPTED: "/general/contacts_module/contacts/?status=accepted",
    INCOMING: "/general/contacts_module/contacts/incoming/",
    BY_ID: (id: number) => `/general/contacts_module/contacts/${id}/`,
    ACCEPT_BY_ID: (id: number) => `/general/contacts_module/contacts/${id}/accept/`,
  },

  LOCATION: {
    CONTACTS: "/general/locations_module/contacts/",
    UPDATE: "/general/locations_module/update/"
  },

  SOS: {
    LIST: "/general/contacts_module/sos/",
    BY_ID: (id: number) => `/general/contacts_module/sos/${id}/`,
    ACTIVATE: (id: number) => `/general/contacts_module/sos/${id}/activate/`,
    DEACTIVATE: (id: number) => `/general/contacts_module/sos/${id}/deactivate/`,
    ANSWER: (id: number) => `/general/contacts_module/sos/${id}/answer/`,
  },

  ALERTS: {
    LIST: "/general/contacts_module/alerts/",
    BY_ID: (id: number) => `/general/contacts_module/alerts/${id}/`,
    ANSWER: (id: number) => `/general/contacts_module/alerts/${id}/answer/`,
    ANSWERS: (id: number) => `/general/contacts_module/alerts/${id}/answers/`,
  },

  NOTIFICATIONS: {
    LIST: "/general/contacts_module/notifications/",
    BY_ID: (id: number) => `/general/contacts_module/notifications/${id}/`,
    MARK_READ: (id: number) => `/general/contacts_module/notifications/${id}/mark-read/`,
    MARK_ALL_READ: "/general/contacts_module/notifications/mark-all-read/",
    UNREAD_COUNT: "/general/contacts_module/notifications/unread-count/",
  },

  SUBSCRIBE: "/push/subscribe/",

  GEOFENCES: {
    LIST:         "/general/contacts_module/geofences/",
    BY_ID:        (id: number) => `/general/contacts_module/geofences/${id}/`,
    CHECK_OUTSIDE:(id: number, childId: number) =>
                  `/general/contacts_module/geofences/${id}/check-outside/?child_id=${childId}`,
  },

  TOUR: {
    GROUPS: "/tour/groups/",
    GROUP_BY_ID: (id: string) => `/tour/groups/${id}/`,
    GROUP_DISMISS: (id: string) => `/tour/groups/${id}/dismiss/`,
    GROUP_STATS: (id: string) => `/tour/groups/${id}/stats/`,
    
    MEMBERS: "/tour/members/",
    MEMBER_BY_ID: (id: number) => `/tour/members/${id}/`,
    MEMBER_ACCEPT: (id: number) => `/tour/members/${id}/accept/`,
    MEMBER_REMOVE: (id: number) => `/tour/members/${id}/remove/`,
    MEMBER_LEAVE: (id: number) => `/tour/members/${id}/leave/`,
    MEMBER_JOIN_BY_CODE: "/tour/members/join_by_code/",
    
    ZONES: "/tour/zones/",
    ZONE_BY_ID: (id: number) => `/tour/zones/${id}/`,
    
    SESSIONS: "/tour/sessions/",
    SESSION_BY_ID: (id: number) => `/tour/sessions/${id}/`,
    SESSION_START: (id: number) => `/tour/sessions/${id}/start/`,
    SESSION_COMPLETE: (id: number) => `/tour/sessions/${id}/complete/`,
    SESSION_CANCEL: (id: number) => `/tour/sessions/${id}/cancel/`,
    SESSION_VIOLATIONS: (id: number) => `/tour/sessions/${id}/violations/`,
    
    LOCATION_UPDATE: "/tour/location/update/",
    INVITE: (code: string) => `/tour/invite/${code}/`,
  },
} as const;