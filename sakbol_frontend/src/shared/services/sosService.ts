import { API_ENDPOINTS } from "../enums/ApiEndpoints";
import type {
  SosSignal,
  AlertSignal,
  AlertSignalAnswer,
  CreateSosSignalBody,
  CreateAlertSignalBody,
  CreateAlertSignalAnswerBody,
} from "../types/sos";
import api from "./axios";

export const sosService = {
  create: (data: CreateSosSignalBody) => {
    return api.post<SosSignal>(API_ENDPOINTS.SOS.LIST, data);
  },

  getList: () => {
    return api.get<SosSignal[]>(API_ENDPOINTS.SOS.LIST);
  },

  getById: (id: number) => {
    return api.get<SosSignal>(API_ENDPOINTS.SOS.BY_ID(id));
  },

  activate: (id: number) => {
    return api.post<SosSignal>(API_ENDPOINTS.SOS.ACTIVATE(id));
  },

  deactivate: (id: number) => {
    return api.post<SosSignal>(API_ENDPOINTS.SOS.DEACTIVATE(id));
  },
};

export const alertsService = {
  create: (data: CreateAlertSignalBody) => {
    return api.post<AlertSignal>(API_ENDPOINTS.ALERTS.LIST, data);
  },

  getList: () => {
    return api.get<AlertSignal[]>(API_ENDPOINTS.ALERTS.LIST);
  },

  getById: (id: number) => {
    return api.get<AlertSignal>(API_ENDPOINTS.ALERTS.BY_ID(id));
  },

  answer: (data: CreateAlertSignalAnswerBody) => {
    return api.post<AlertSignalAnswer>(
      API_ENDPOINTS.ALERTS.ANSWER(data.alert_signal_id),
      data
    );
  },

  getAnswers: (id: number) => {
    return api.get<AlertSignalAnswer[]>(API_ENDPOINTS.ALERTS.ANSWERS(id));
  },
};
