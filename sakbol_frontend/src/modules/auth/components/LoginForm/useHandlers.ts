import { useNavigate } from "react-router-dom";
import type { LoginFormType } from "../../utils/schemas";
import useAuth from "../../../../store/useAuth";
import { authService } from "../../../../shared/services/authService";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../../shared/enums/ToastTypes";
import UrlNames from "../../../../shared/enums/UrlNames";
import { parseApiErrorToArray } from "../../../../shared/utils/parseApiErrorToArray";
import { useState } from "react";

export function useHandlers() {
    const navigate = useNavigate();
    const setTokenPair = useAuth((state) => state.setTokenPair);
    const setUserId = useAuth((state) => state.setUserId);
    const setUserRole = useAuth((state) => state.setUserRole);
    const [isLoading, setLoading] = useState(false);

    const onFormSubmit = async (data: LoginFormType) => {
        if (isLoading) return;

        setLoading(true);

        try {
            const response = await authService.login(data);

            setTokenPair(response.data.access, response.data.refresh);
            setUserId(response.data.user_id);
            setUserRole(response.data.role);

            addToast({
                title: ToastTypes.OK,
                description: "Вы вошли в аккаунт",
                color: "success",
            });

            setTimeout(() => {
                navigate(`/${UrlNames.SOS_PROFILE}`)
            }, 1000)
        } catch (error) {
            const messages = parseApiErrorToArray(error);
            messages.forEach((message) =>
                addToast({
                    title: ToastTypes.ERR,
                    description: message,
                    color: "danger",
                })
            );
        } finally {
            setLoading(false)
        }
    }

    return { onFormSubmit, isLoading }
}