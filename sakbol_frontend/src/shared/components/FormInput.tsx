import { Input } from "@heroui/react";
import { useFormContext } from "react-hook-form";

type Props = {
  name: string;
  label: string;
  type?: string;
  placeholder: string;
};

export function FormInput({ name, label, type = "text", placeholder }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const fieldError = errors[name]?.message as string | undefined;

  return (
    <Input
      label={label}
      labelPlacement="outside-top"
      type={type}
      placeholder={placeholder}
      variant="flat"
      isInvalid={!!fieldError}
      errorMessage={fieldError}
      {...register(name)}
    />
  );
}