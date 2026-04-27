import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { useController, useFormContext } from "react-hook-form";

type Props = {
  name: string;
  label: string;
  placeholder: string;
  items: string[];
};

export function FormAutocomplete({ name, label, placeholder, items }: Props) {
  const { control, formState: { errors } } = useFormContext();
  const {
    field: { onChange, value, ref },
  } = useController({
    name,
    control,
  });

  const fieldError = errors[name]?.message as string | undefined;

  return (
    <Autocomplete
      label={label}
      labelPlacement="outside-top"
      placeholder={placeholder}
      variant="flat"
      allowsCustomValue
      defaultItems={items.map((city) => ({ label: city, value: city }))}
      inputValue={value || ""}
      onInputChange={(val) => onChange(val)}
      onSelectionChange={(key) => {
        if (key) {
          onChange(key as string);
        }
      }}
      isInvalid={!!fieldError}
      errorMessage={fieldError}
    >
      {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
    </Autocomplete>
  );
}
