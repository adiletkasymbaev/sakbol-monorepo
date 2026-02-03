// @ts-nocheck
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Input, Button, addToast } from "@heroui/react";
import makeBool from "../../../shared/utils/makeBool";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../../../features/auth/authApiSlice";
import { setCredentials } from "../../../features/auth/authSlice";
import { useDispatch } from "react-redux"
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { UrlNames } from "../../../shared/enums/UrlNames";

// Валидационная схема
const LoginSchema = Yup.object().shape({
  email: Yup.string().email("Неверный email").required("Обязательное поле"),
  password: Yup.string().min(6, "Минимум 6 символов").required("Обязательное поле"),
});

interface LoginFormValues {
  email: string;
  password: string;
}

function LoginForm() {
    const initialValues: LoginFormValues = {
        email: "",
        password: "",
    };

    const navigate = useNavigate()
    const [login, { isLoading }] = useLoginMutation()
    const dispatch = useDispatch()

    const handleSubmit = async (values: LoginFormValues) => {
        try {
            const userData = await login({ email: values.email, password: values.password }).unwrap()
            dispatch(setCredentials({ accessToken: userData.access, user: {email: values.email} }))
            if (window?.AndroidBridge?.setAccessToken) {
                AndroidBridge.setAccessToken(userData.access);
            }

            navigate(UrlNames.MAIN)
        } catch (err) {
            let errorMessage = ""

            if (!err?.originalStatus) {
                errorMessage = "Неполадки с сервером"
            } else if (err.originalStatus === 400) {
                errorMessage = "Электронная почта или пароль не были указаны"
            } else if (err.originalStatus === 401) {
                errorMessage = "Вы не авторизованы"
            } else {
                errorMessage = "Не удалось войти в аккаунт"
            }

            addToast({
                title: ToastTypes.ERR,
                description: errorMessage,
                color: "primary",
                severity: "danger"
            });
        }
    };

    const content = (
        <Formik
            initialValues={initialValues}
            validationSchema={LoginSchema}
            onSubmit={handleSubmit}
        >
        {({ isSubmitting, errors, touched, isValid, dirty }) => (
            <Form className="flex flex-col gap-4">
                <Field name="email">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        type="email"
                        placeholder="Введите email"
                        label="Электронная почта"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.email && errors.email)}
                        errorMessage={errors.email}
                    />
                    )}
                </Field>

                <Field name="password">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        type="password"
                        placeholder="Введите пароль"
                        label="Пароль"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.password && errors.password)}
                        errorMessage={errors.password}
                    />
                    )}
                </Field>

                <div className="flex flex-col gap-2">
                    <Button 
                        type="submit" 
                        isDisabled={!isValid || !dirty || isSubmitting} 
                        isLoading={isSubmitting}
                        color="primary"
                    >
                        Войти
                    </Button>
                    <Button 
                        type="submit" 
                        isDisabled={isSubmitting} 
                        color="default" 
                        variant="bordered" 
                        startContent={<img className="size-4" src="images/google.svg" alt="" />}
                    >
                        Войти с Google
                    </Button>
                </div>
            </Form>
        )}
        </Formik>
    );

    return content
}

export default LoginForm;