export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: "/accounts/register/",
    LOGIN: "/accounts/login/",
    REFRESH: "/accounts/refresh/",
  },

  PROFILE: {
    ME: "/accounts/profile/me/",
    AVATAR: "/accounts/profile/avatar/",
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

  SUBSCRIBE: "/push/subscribe/",

  GEOFENCES: {
    LIST:         "/general/contacts_module/geofences/",
    BY_ID:        (id: number) => `/general/contacts_module/geofences/${id}/`,
    CHECK_OUTSIDE:(id: number, childId: number) =>
                  `/general/contacts_module/geofences/${id}/check-outside/?child_id=${childId}`,
  },
} as const;