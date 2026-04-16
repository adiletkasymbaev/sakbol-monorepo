import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";

interface CreateTourSessionFormProps {
  groupId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateTourSessionForm({ groupId, onSuccess, onCancel }: CreateTourSessionFormProps) {
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isLoading, setIsLoading] = useState(false);
  const { createSession } = useTour();

  const handleCreate = async () => {
    if (durationMinutes < 1 || durationMinutes > 1440) {
      addToast({
        title: ToastTypes.ERR,
        description: "Длительность должна быть от 1 до 1440 минут",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await createSession(groupId, durationMinutes);
      
      if (result) {
        addToast({
          title: ToastTypes.OK,
          description: "Сессия тура создана",
          color: "success",
        });
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error creating session:", error);
      addToast({
        title: ToastTypes.ERR,
        description: "Не удалось создать сессию",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Длительность тура (минуты)</label>
        <Input
          type="number"
          value={durationMinutes.toString()}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          min={1}
          max={1440}
          className="w-full"
          disabled={isLoading}
        />
        <p className="text-xs text-default-500 mt-1">
          От 1 до 1440 минут (от 1 минуты до 24 часов)
        </p>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button
            variant="light"
            onPress={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Отмена
          </Button>
        )}
        <Button
          color="primary"
          onPress={handleCreate}
          isLoading={isLoading}
          className="flex-1"
        >
          Создать тур
        </Button>
      </div>
    </div>
  );
}
