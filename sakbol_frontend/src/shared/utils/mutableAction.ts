import { addToast } from "@heroui/react";
import { ToastTypes } from "../enums/ToastTypes";
import { parseApiErrorToArray } from "./parseApiErrorToArray";

type BoolAction = (id: number) => Promise<boolean>;

type MutableActionParams = {
  id: number;
  action: BoolAction;
  okText: string;
  onSuccess?: () => void | Promise<void>;
  onError?: () => void | Promise<void>;
};

export async function mutableAction({
  id,
  action,
  okText,
  onSuccess,
  onError,
}: MutableActionParams): Promise<boolean> {
  try {
    const ok = await action(id);

    if (ok) {
      addToast({
        title: ToastTypes.OK,
        description: okText,
        color: "success",
      });

      if (onSuccess) {
        await onSuccess();
      }

      return true;
    }
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
    if (onError) {
      await onError();
    }

    return false;
  }
}