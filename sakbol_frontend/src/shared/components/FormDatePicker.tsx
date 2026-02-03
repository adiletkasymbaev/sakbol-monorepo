import { DatePicker } from "@heroui/react";
import { useFormContext, Controller } from "react-hook-form";

type Props = {
  name: string;
  label: string;
};

export function FormDatePicker({ name, label }: Props) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <DatePicker
          labelPlacement="outside-top"
          label={label}
          variant="flat"
          value={field.value}
          onChange={field.onChange}
          isInvalid={!!fieldError}
          errorMessage={fieldError}
        />
      )}
    />
  );
}