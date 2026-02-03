import { create } from "zustand";
import { contactsService } from "../shared/services/contactsService";
import type { Contact, addContactBody } from "../shared/types/contacts";

type ContactsState = {
  contactsPendingList: Contact[];
  contactsAcceptedList: Contact[];
  contactsIncomingList: Contact[];

  isPendingLoading: boolean;
  isAcceptedLoading: boolean;
  isIncomingLoading: boolean;

  isActionLoading: boolean;
  error: unknown | null;

  getPending: () => Promise<void>;
  getAccepted: () => Promise<void>;
  getIncoming: () => Promise<void>;

  addContact: (data: addContactBody) => Promise<Contact | null>;
  destroyContact: (id: number) => Promise<boolean>;
  acceptContact: (id: number) => Promise<boolean>;
};

export const useContacts = create<ContactsState>((set, get) => ({
  contactsPendingList: [],
  contactsAcceptedList: [],
  contactsIncomingList: [],

  isPendingLoading: false,
  isAcceptedLoading: false,
  isIncomingLoading: false,

  isActionLoading: false,
  error: null,

  getPending: async () => {
    set({ isPendingLoading: true, error: null });
    try {
      const res = await contactsService.getContactsPending();
      set({ contactsPendingList: res.data?.results as Contact[] });
    } catch (error) {
      set({ error });
    } finally {
      set({ isPendingLoading: false });
    }
  },

  getAccepted: async () => {
    set({ isAcceptedLoading: true, error: null });
    try {
      const res = await contactsService.getContactsAccepted();
      set({ contactsAcceptedList: res.data?.results as Contact[] });
    } catch (error) {
      set({ error });
    } finally {
      set({ isAcceptedLoading: false });
    }
  },

  getIncoming: async () => {
    set({ isIncomingLoading: true, error: null });
    try {
      const res = await contactsService.getContactsIncoming();
      set({ contactsIncomingList: res.data?.results as Contact[] });
    } catch (error) {
      set({ error });
    } finally {
      set({ isIncomingLoading: false });
    }
  },

  addContact: async (data: addContactBody) => {
    set({ isActionLoading: true, error: null });
    try {
      const res = await contactsService.addContact(data);
      const created = res.data as Contact;

      set((state) => ({
        contactsPendingList: [created, ...state.contactsPendingList],
      }));
      await get().getIncoming();

      return created;
    } catch (error) {
      set({ error });
      return null;
    } finally {
      set({ isActionLoading: false });
    }
  },

  destroyContact: async (id: number) => {
    set({ isActionLoading: true, error: null });
    try {
      await contactsService.destroyContact(id);

      set((state) => ({
        contactsPendingList: state.contactsPendingList.filter((c) => c.id !== id),
        contactsAcceptedList: state.contactsAcceptedList.filter((c) => c.id !== id),
        contactsIncomingList: state.contactsIncomingList.filter((c) => c.id !== id),
      }));

      return true;
    } catch (error) {
      set({ error });
      return false;
    } finally {
      set({ isActionLoading: false });
    }
  },

  acceptContact: async (id: number) => {
    set({ isActionLoading: true, error: null });

    const incomingContact = get().contactsIncomingList.find((c) => c.id === id);

    try {
      await contactsService.acceptContact(id);

      set((state) => ({
        contactsIncomingList: state.contactsIncomingList.filter((c) => c.id !== id),
        contactsAcceptedList: incomingContact
          ? [incomingContact, ...state.contactsAcceptedList]
          : state.contactsAcceptedList,
      }));

      await Promise.all([get().getIncoming(), get().getAccepted()]);

      return true;
    } catch (error) {
      set({ error });
      return false;
    } finally {
      set({ isActionLoading: false });
    }
  },
}));