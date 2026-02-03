import { useState } from "react";
import type { AddContactFormType } from "../../utils/roles";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../../shared/utils/parseApiErrorToArray";
import { useContacts } from "../../../../store/useContacts";

export function useHandlers() {
  const [isLoading, setLoading] = useState(false);

  const { addContact, getPending, getIncoming, error } = useContacts();

  const onFormSubmit = async (data: AddContactFormType) => {
    if (isLoading) return;

    setLoading(true);

    try {
      const created = await addContact(data);

      if (!created) {
        const messages = parseApiErrorToArray(error);
        messages.forEach((message) =>
          addToast({
            title: ToastTypes.ERR,
            description: message,
            color: "danger",
          })
        );
        return;
      }

      addToast({
        title: ToastTypes.OK,
        description: "Вы отправили заявку",
        color: "success",
      });

      // Обновляем списки после добавления
      await Promise.all([getPending(), getIncoming()]);
    } catch (e) {
      const messages = parseApiErrorToArray(e);
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