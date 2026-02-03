import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { type RegisterFormType, registerSchema } from "../../utils/schemas";
import { FormInput } from "../../../../shared/components/FormInput";
import { FormDatePicker } from "../../../../shared/components/FormDatePicker";
import { Button } from "@heroui/react";
import useAuth from "../../../../store/useAuth";
import UrlNames from "../../../../shared/enums/UrlNames";
import { Link } from "react-router-dom";
import Margin from "../../../../shared/components/Margin";
import { useHandlers } from "./useHandlers";

function RegisterForm() {
    const selectedRole = useAuth((state) => state.selectedRole)
    const methods = useForm<RegisterFormType>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            role: selectedRole
        }
    })
    const { onFormSubmit, isLoading } = useHandlers()

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-3.5">
                <FormInput name="phone_number" label="Номер телефона" placeholder="Введите ваш номер телефона" />
                <FormInput name="email" label="Email" placeholder="Введите ваш email" />
                <FormInput name="password" label="Пароль" placeholder="Введите пароль" type="password" />
                
                <FormInput name="first_name" label="Имя" placeholder="Введите ваше имя" />
                <FormInput name="last_name" label="Фамилия" placeholder="Введите вашу фамилию" />
                <FormDatePicker name="birth_date" label="Дата рождения" />

                <FormInput name="city" label="Город" placeholder="Укажите ваш город" />
                <FormInput name="street" label="Улица" placeholder="Введите название улицы" />
                <FormInput name="house_number" label="Номер дома" placeholder="Введите номер дома" />
                <FormInput name="apartment_number" label="Номер квартиры (Необяз.)" placeholder="Введите номер квартиры" />

                <FormInput name="med_info" label="Информация о здоровье (Необяз.)" placeholder="Введите информацию" />
                
                <Margin direction="b" value={1} />

                <Button color="primary" type="submit" isLoading={isLoading}>
                    Подтвердить
                </Button>

                <Button 
                    as={Link}
                    type="submit" 
                    color="secondary"
                    className="w-full"
                    to={"/" + UrlNames.SELECT_ROLE}
                >
                    Вернуться
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default RegisterForm;