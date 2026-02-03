import { addToast } from "@heroui/react";
import { authService } from "../../../../shared/services/authService";
import { dateToString } from "../../../../shared/utils/dateToString";
import type { RegisterFormType } from "../../utils/schemas";
import useAuth from "../../../../store/useAuth";
import { ToastTypes } from "../../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../../shared/utils/parseApiErrorToArray";
import { useNavigate } from "react-router-dom";
import UrlNames from "../../../../shared/enums/UrlNames";
import { useState } from "react";

export function useHandlers() {
  const navigate = useNavigate();
  const setTokenPair = useAuth((state) => state.setTokenPair);
  const setUserId = useAuth((state) => state.setUserId);
  const setUserRole = useAuth((state) => state.setUserRole);
  const [isLoading, setLoading] = useState(false);

  const onFormSubmit = async (data: RegisterFormType) => {
    if (isLoading) return;

    setLoading(true);

    const date = dateToString(data.birth_date);
    const payload = {
      ...data,
      birth_date: date,
    };

    try {
      const response = await authService.register(payload);

      setTokenPair(response.data.access, response.data.refresh);
      setUserId(response.data.user_id);
      setUserRole(response.data.role);

      addToast({
        title: ToastTypes.OK,
        description: "Вы зарегистрировались",
        color: "success",
      });

      setTimeout(() => {
        navigate(`/${UrlNames.LOGIN}`)
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
  };

  return { onFormSubmit, isLoading }
}