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
    const setLoginData = useAuth((state) => state.setLoginData);
    const [isLoading, setLoading] = useState(false);

    const onFormSubmit = async (data: LoginFormType) => {
        if (isLoading) return;
        setLoading(true);

        try {
            const response = await authService.login(data);
            const { access, refresh, user_id, role } = response.data;

            setLoginData(access, refresh, user_id, role);

            // verify it saved correctly
            console.log("saved userId:", useAuth.getState().userId);

            addToast({
                title: ToastTypes.OK,
                description: "Вы вошли в аккаунт",
                color: "success",
            });

            setTimeout(() => {
                navigate(`/${UrlNames.SOS_PROFILE}`);
            }, 1000);
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
            setLoading(false);
        }
    };

    return { onFormSubmit, isLoading };
}