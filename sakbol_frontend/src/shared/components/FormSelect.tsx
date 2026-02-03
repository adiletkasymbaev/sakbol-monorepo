import { Select, SelectItem } from "@heroui/react";
import { useFormContext, Controller } from "react-hook-form";

type Option = {
  label: string;
  value: string;
};

interface FormSelectProps {
  name: string;
  label: string;
  placeholder: string;
  options: Option[];
}

export function FormSelect({ name, label, placeholder, options }: FormSelectProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const errorMessage = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          label={label}
          placeholder={placeholder}
          variant="flat"
          selectedKeys={field.value ? [field.value] : []}
          onSelectionChange={(keys) =>
            field.onChange(Array.from(keys)[0])
          }
          isInvalid={!!errorMessage}
          errorMessage={errorMessage}
        >
          {options.map((opt) => (
            <SelectItem key={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </Select>
      )}
    />
  );
}