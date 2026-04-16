import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";

interface JoinGroupByCodeProps {
  onSuccess?: () => void;
}

export default function JoinGroupByCode({ onSuccess }: JoinGroupByCodeProps) {
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { joinByCode } = useTour();

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) {
      addToast({
        title: ToastTypes.ERR,
        description: "Код должен содержать 6 символов",
        color: "danger",
      });
      return;
    }

    setIsLoading(true);
    const result = await joinByCode(code.toUpperCase());
    setIsLoading(false);

    if (result) {
      addToast({
        title: ToastTypes.OK,
        description: "Заявка на вступление отправлена",
        color: "success",
      });
      setCode("");
      onSuccess?.();
    } else {
      addToast({
        title: ToastTypes.ERR,
        description: "Неверный код приглашения",
        color: "danger",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-pale-secondary rounded-lg">
      <p className="text-sm font-medium">Вступить в группу по коду</p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          color="primary"
          isLoading={isLoading}
          onPress={handleJoin}
        >
          Вступить
        </Button>
      </div>
      <p className="text-xs text-default-600">
        Введите 6-значный код из пригласительной ссылки
      </p>
    </div>
  );
}
