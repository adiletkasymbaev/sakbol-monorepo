import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterFormType, registerSchema } from "../../utils/schemas";
import { FormInput } from "../../../../shared/components/FormInput";
import { FormDatePicker } from "../../../../shared/components/FormDatePicker";
import { FormAutocomplete } from "../../../../shared/components/FormAutocomplete";
import { KYRGYZSTAN_CITIES } from "../../../../shared/constants/kyrgyzstanCities";
import { Button } from "@heroui/react";
import useAuth from "../../../../store/useAuth";
import UrlNames from "../../../../shared/enums/UrlNames";
import { Link } from "react-router-dom";
import Margin from "../../../../shared/components/Margin";
import { useHandlers } from "./useHandlers";
import { useTranslation } from "react-i18next";

interface RegisterFormProps {
    onSuccess: (email: string) => void;
}

function RegisterForm({ onSuccess }: RegisterFormProps) {
    const { t } = useTranslation();
    const selectedRole = useAuth((state) => state.selectedRole)
    const methods = useForm<RegisterFormType>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: selectedRole
        }
    })
    const { onFormSubmit, isLoading } = useHandlers({ onSuccess })

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-3.5">
                <FormInput name="phone_number" label={t('auth.form.phone')} placeholder={t('auth.form.phonePlaceholder')} />
                <FormInput name="email" label={t('auth.form.email')} placeholder={t('auth.form.emailPlaceholder')} />
                <FormInput name="password" label={t('auth.form.password')} placeholder={t('auth.form.passwordPlaceholder')} type="password" />
                
                <FormInput name="first_name" label={t('auth.form.firstName')} placeholder={t('auth.form.firstNamePlaceholder')} />
                <FormInput name="last_name" label={t('auth.form.lastName')} placeholder={t('auth.form.lastNamePlaceholder')} />
                <FormDatePicker name="birth_date" label={t('auth.form.birthDate')} />

                <FormAutocomplete name="city" label={t('auth.form.city')} placeholder={t('auth.form.cityPlaceholder')} items={KYRGYZSTAN_CITIES} />
                <FormInput name="street" label={t('auth.form.street')} placeholder={t('auth.form.streetPlaceholder')} />
                <FormInput name="house_number" label={t('auth.form.houseNumber')} placeholder={t('auth.form.houseNumberPlaceholder')} />
                <FormInput name="apartment_number" label={t('auth.form.apartmentNumber')} placeholder={t('auth.form.apartmentNumberPlaceholder')} />

                <FormInput name="med_info" label={t('auth.form.healthInfo')} placeholder={t('auth.form.healthInfoPlaceholder')} />
                
                <Margin direction="b" value={1} />

                <Button color="primary" type="submit" isLoading={isLoading}>
                    {t('auth.form.confirm')}
                </Button>

                <Button 
                    as={Link}
                    type="submit" 
                    color="secondary"
                    className="w-full"
                    to={"/" + UrlNames.SELECT_ROLE}
                >
                    {t('auth.form.back')}
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default RegisterForm;