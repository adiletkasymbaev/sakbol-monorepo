import { apiSlice } from "../../api/apiSlice";
import type { Contact } from "../../shared/types/contacts";

export const contactsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Получить все контакты
    getContacts: builder.query<Contact[], void>({
      query: () => "/contacts/",
      providesTags: ["Contacts"],
    }),

    // Отправить заявку по identifier
    sendContactRequest: builder.mutation({
      query: (identifier: string) => ({
        url: "/contacts/",
        method: "POST",
        body: { identifier },
      }),
      invalidatesTags: ["Contacts"],
    }),

    cancelContactRequest: builder.mutation({
      query: (contactId: number) => ({
        url: `/contacts/${contactId}/cancel/`,
        method: "POST",
      }),
      invalidatesTags: ["Contacts"],
    }),


    // Принять заявку
    acceptContactRequest: builder.mutation({
      query: (contactId: number) => ({
        url: `/contacts/${contactId}/accept/`,
        method: "POST",
      }),
      invalidatesTags: ["Contacts"],
    }),

    // Входящие заявки
    getIncomingRequests: builder.query<Contact[], void>({
      query: () => "/contacts/incoming-requests/",
      providesTags: ["Contacts"],
    }),

    // Исходящие заявки
    getOutgoingRequests: builder.query<Contact[], void>({
      query: () => "/contacts/outgoing-requests/",
      providesTags: ["Contacts"],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useSendContactRequestMutation,
  useAcceptContactRequestMutation,
  useGetIncomingRequestsQuery,
  useGetOutgoingRequestsQuery,
  useCancelContactRequestMutation
} = contactsApiSlice;