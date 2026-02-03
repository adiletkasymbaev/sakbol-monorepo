import { Controller, useFormContext } from "react-hook-form";
import { InputOtp } from "@heroui/react";

type Props = {
  name: string;
};

export default function CustomOtpField({ name }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <InputOtp
          length={6}
          size="lg"
          allowedKeys="^[A-Za-z0-9]*$"
          value={(field.value ?? "").toUpperCase()}
          onValueChange={(val) => field.onChange((val ?? "").toUpperCase())}
          onBlur={field.onBlur}
          isInvalid={!!fieldState.error}
          errorMessage={fieldState.error?.message}
          classNames={{
            input: "uppercase",
          }}
        />
      )}
    />
  );
}