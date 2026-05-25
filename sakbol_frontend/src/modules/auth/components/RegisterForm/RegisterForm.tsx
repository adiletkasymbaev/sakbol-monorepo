import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterFormType, registerSchema } from "../../utils/schemas";
import { FormInput } from "../../../../shared/components/FormInput";
import { FormSelect } from "../../../../shared/components/FormSelect";
import { Button } from "@heroui/react";
import UrlNames from "../../../../shared/enums/UrlNames";
import { Link } from "react-router-dom";
import Margin from "../../../../shared/components/Margin";
import { useHandlers } from "./useHandlers";
import { useTranslation } from "react-i18next";
import roles from "../../utils/roles";

interface RegisterFormProps {
    onSuccess: (email: string) => void;
}

const roleOptions = roles.map((r) => ({
    label: r.title,
    value: r.key,
}));

function RegisterForm({ onSuccess }: RegisterFormProps) {
    const { t } = useTranslation();
    const methods = useForm<RegisterFormType>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: "user"
        }
    })
    const { onFormSubmit, isLoading } = useHandlers({ onSuccess })

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-3.5">
                <FormInput name="email" label={t('auth.form.email')} placeholder={t('auth.form.emailPlaceholder')} />
                <FormInput name="password" label={t('auth.form.password')} placeholder={t('auth.form.passwordPlaceholder')} type="password" />
                
                <FormInput name="first_name" label={t('auth.form.firstName')} placeholder={t('auth.form.firstNamePlaceholder')} />
                <FormInput name="last_name" label={t('auth.form.lastName')} placeholder={t('auth.form.lastNamePlaceholder')} />
                <FormSelect name="role" label={t('auth.form.rolePlaceholder')} options={roleOptions} placeholder={t('auth.form.rolePlaceholder')} />
                
                <Margin direction="b" value={1} />

                <Button color="primary" type="submit" isLoading={isLoading}>
                    {t('auth.form.confirm')}
                </Button>

                <Button 
                    as={Link}
                    type="submit" 
                    color="secondary"
                    className="w-full"
                    to={"/" + UrlNames.LOGIN}
                >
                    {t('auth.form.back')}
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default RegisterForm;