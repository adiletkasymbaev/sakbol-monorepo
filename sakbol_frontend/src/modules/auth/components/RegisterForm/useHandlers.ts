import { addToast } from "@heroui/react";
import { authService } from "../../../../shared/services/authService";
import type { RegisterFormType } from "../../utils/schemas";
import { ToastTypes } from "../../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../../shared/utils/parseApiErrorToArray";
import { useNavigate } from "react-router-dom";
import UrlNames from "../../../../shared/enums/UrlNames";
import { useState } from "react";

export function useHandlers({ onSuccess }: { onSuccess: (email: string) => void }) {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);

  const onFormSubmit = async (data: RegisterFormType) => {
    if (isLoading) return;
    setLoading(true);

    try {
      const response = await authService.register(data);
      addToast({
        title: ToastTypes.OK,
        description: response.data.detail || "Код отправлен",
        color: "success",
      });

      onSuccess(response.data.email);
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