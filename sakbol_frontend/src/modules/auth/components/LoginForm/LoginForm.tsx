import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { loginSchema, type LoginFormType } from "../../utils/schemas";
import { Button } from "@heroui/react";
import { FormInput } from "../../../../shared/components/FormInput";
import { useHandlers } from "./useHandlers";
import { useTranslation } from "react-i18next";

function LoginForm() {
    const { t } = useTranslation();
    const methods = useForm<LoginFormType>({
        resolver: zodResolver(loginSchema),
    })
    const { onFormSubmit, isLoading } = useHandlers()

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-3.5">
                <FormInput name="email" label={t('auth.form.email')} placeholder={t('auth.form.emailPlaceholder')} />
                <FormInput name="password" label={t('auth.form.password')} placeholder={t('auth.form.passwordPlaceholder')} type="password" />

                 <Button color="primary" type="submit" isLoading={isLoading}>
                    {t('auth.form.loginButton')}
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default LoginForm;