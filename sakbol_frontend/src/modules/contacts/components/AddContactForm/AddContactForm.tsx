import { Button } from "@heroui/react";
import CustomOtpField from "../../../../shared/components/CustomOtpField";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { type AddContactFormType, addContactSchema } from "../../utils/roles";
import { useHandlers } from "./useHandlers";
import { useTranslation } from "react-i18next";

function AddContactForm() {
    const { t } = useTranslation();
    const methods = useForm<AddContactFormType>({
        resolver: zodResolver(addContactSchema),
        defaultValues: { identifier: "" },
        mode: "onSubmit",
    });
    const { onFormSubmit, isLoading } = useHandlers()

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-2 items-center">
                <CustomOtpField name="identifier" />

                <Button
                    color="secondary"
                    type="submit"
                    className="w-full"
                    isLoading={isLoading}
                    isDisabled={isLoading}
                >
                    <span className="text-lg font-semibold">{t('contacts.addContact')}</span>
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default AddContactForm;