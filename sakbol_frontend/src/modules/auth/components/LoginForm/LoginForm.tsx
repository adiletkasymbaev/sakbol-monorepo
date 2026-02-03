import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { loginSchema, type LoginFormType } from "../../utils/schemas";
import { Button } from "@heroui/react";
import { FormInput } from "../../../../shared/components/FormInput";
import { useHandlers } from "./useHandlers";

function LoginForm() {
    const methods = useForm<LoginFormType>({
        resolver: zodResolver(loginSchema),
    })
    const { onFormSubmit, isLoading } = useHandlers()

    const content = (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onFormSubmit)} className="flex flex-col gap-3.5">
                <FormInput name="email" label="Email" placeholder="Введите ваш email" />
                <FormInput name="password" label="Пароль" placeholder="Введите пароль" type="password" />

                 <Button color="primary" type="submit" isLoading={isLoading}>
                    Войти
                </Button>
            </form>
        </FormProvider>
    );

    return content;
}

export default LoginForm;