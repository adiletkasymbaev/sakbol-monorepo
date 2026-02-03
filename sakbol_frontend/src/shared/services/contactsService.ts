import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type { addContactBody, Contact } from "../types/contacts";
import api from "./axios";

export const contactsService = {
  addContact: (data: addContactBody) => {
    return api.post<Contact>(API_ENDPOINTS.CONTACTS.ADD, data);
  },

  destroyContact: (id: number) => {
    return api.delete<void>(API_ENDPOINTS.CONTACTS.BY_ID(id));
  },

  acceptContact: (id: number) => {
    return api.post<void>(API_ENDPOINTS.CONTACTS.ACCEPT_BY_ID(id));
  },

  getContactsPending: () => {
    return api.get(API_ENDPOINTS.CONTACTS.PENDING);
  },

  getContactsAccepted: () => {
    return api.get(API_ENDPOINTS.CONTACTS.ACCEPTED);
  },

  getContactsIncoming: () => {
    return api.get(API_ENDPOINTS.CONTACTS.INCOMING);
  },
};