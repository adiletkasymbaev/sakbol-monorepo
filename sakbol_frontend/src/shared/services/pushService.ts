import { API_ENDPOINTS } from "../enums/ApiEndpoints"
import type { PushBody } from "../types/push"
import api from "./axios"

export const pushService = {
    subscribe: (sub: PushBody) => {
        return api.post(API_ENDPOINTS.SUBSCRIBE, sub)
    }
}