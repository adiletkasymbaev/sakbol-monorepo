import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Button } from "@heroui/react";
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { FormInput } from "../../../shared/components/FormInput";
import { createTourGroupSchema, type CreateTourGroupFormType } from "../utils/schemas";
import { useState } from "react";
import useTour from "../../../store/useTour";

interface CreateTourGroupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateTourGroupForm({ onSuccess, onCancel }: CreateTourGroupFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { createGroup } = useTour();

  const methods = useForm<CreateTourGroupFormType>({
    resolver: zodResolver(createTourGroupSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onSubmit = async (data: CreateTourGroupFormType) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await createGroup(data.name, data.description);
      
      if (result) {
        addToast({
          title: ToastTypes.OK,
          description: "Группа создана",
          color: "success",
        });
        onSuccess?.();
      } else {
        addToast({
          title: ToastTypes.ERR,
          description: "Не удалось создать группу",
          color: "danger",
        });
      }
    } catch (error: any) {
      console.error("Error creating group:", error);
      const message = error?.response?.data?.detail || "Ошибка при создании группы";
      addToast({
        title: ToastTypes.ERR,
        description: message,
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <FormInput
          name="name"
          label="Название группы"
          placeholder="Например: Поход в горы"
        />
        
        <FormInput
          name="description"
          label="Описание (необязательно)"
          placeholder="Краткое описание тура"
        />

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="light"
              onPress={onCancel}
              className="flex-1"
            >
              Отмена
            </Button>
          )}
          <Button
            type="submit"
            color="primary"
            isLoading={isLoading}
            className="flex-1"
          >
            Создать группу
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
