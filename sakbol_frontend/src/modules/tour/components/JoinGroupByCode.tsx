import { useState } from "react";
import { Button, Input } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import useTour from "../../../store/useTour";
import { useTranslation } from "react-i18next";

interface JoinGroupByCodeProps {
  onSuccess?: () => void;
}

export default function JoinGroupByCode({ onSuccess }: JoinGroupByCodeProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { joinByCode } = useTour();

  const handleJoin = async () => {
    if (!code.trim() || code.length !== 6) {
      addToast({
        title: ToastTypes.ERR,
        description: t('tour.joinByCode.codeLength'),
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
        description: t('tour.joinByCode.requestSent'),
        color: "success",
      });
      setCode("");
      onSuccess?.();
    } else {
      addToast({
        title: ToastTypes.ERR,
        description: t('tour.joinByCode.invalidCode'),
        color: "danger",
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-pale-secondary rounded-lg">
      <p className="text-sm font-medium">{t('tour.joinByCode.title')}</p>
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
          {t('tour.joinByCode.joinButton')}
        </Button>
      </div>
      <p className="text-xs text-default-600">
        {t('tour.joinByCode.placeholder')}
      </p>
    </div>
  );
}
