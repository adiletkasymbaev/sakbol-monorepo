// @ts-nocheck
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Input, Button, addToast, Select, SelectItem, Checkbox } from "@heroui/react";
import { Link, useNavigate } from "react-router-dom";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import makeBool from "../../../shared/utils/makeBool";
import { UrlNames } from "../../../shared/enums/UrlNames";
import LoginFallback from "./LoginFallback";
import Margin from "../../../shared/components/Margin";
import Headline from "../../../shared/components/Headline";
import { useRegisterMutation } from "../../../features/auth/authApiSlice";

// Валидационная схема
const RegisterSchema = Yup.object().shape({
  first_name: Yup.string().required("Введите имя"),
  last_name: Yup.string().required("Введите фамилию"),
  role: Yup.string().required("Выберите роль"),
  email: Yup.string().email("Неверный email").required("Введите email"),
  password: Yup.string().min(6, "Минимум 6 символов").required("Введите пароль"),
  password2: Yup.string()
    .oneOf([Yup.ref("password")], "Пароли не совпадают")
    .required("Подтвердите пароль"),
  agree: Yup.boolean().oneOf([true], "Вы должны согласиться с политикой конфиденциальности"),
});

interface RegisterFormValues {
  first_name: string;
  last_name: string;
  role: string;
  email: string;
  password: string;
  password2: string;
}

function RegisterForm() {
  const navigate = useNavigate();
  const [registerUser, { isLoading }] = useRegisterMutation();

  const initialValues: RegisterFormValues = {
    first_name: "",
    last_name: "",
    role: "user",
    email: "",
    password: "",
    password2: "",
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    try {
      await registerUser({
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        email: values.email,
        password: values.password,
        password2: values.password2,
      }).unwrap();

      addToast({
        title: ToastTypes.OK,
        description: "Регистрация прошла успешно!",
        color: "success",
      });

      navigate("/" + UrlNames.LOGIN);
    } catch (err: any) {
      let errorMessage = "";

      if (!err?.originalStatus) {
        errorMessage = "Неполадки с сервером";
      } else if (err.originalStatus === 400) {
        errorMessage = "Некорректные данные регистрации";
      } else {
        errorMessage = "Не удалось зарегистрироваться";
      }

      addToast({
        title: ToastTypes.ERR,
        description: errorMessage,
        color: "primary",
        severity: "danger",
      });
    }
  };

  return (
    <div className="">
        <Headline
            secondaryText="Регистрация"
            mainText="Создать аккаунт"
        />
        <Margin direction="b" value={6}/>

        <Formik
            initialValues={initialValues}
            validationSchema={RegisterSchema}
            onSubmit={handleSubmit}
        >
            {({ errors, touched, isSubmitting, isValid, dirty, values, setFieldValue }) => (
                <Form className="flex flex-col gap-4">
                {/* Имя */}
                <Field name="first_name">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        label="Имя"
                        placeholder="Введите имя"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.first_name && errors.first_name)}
                        errorMessage={errors.first_name}
                    />
                    )}
                </Field>

                {/* Фамилия */}
                <Field name="last_name">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        label="Фамилия"
                        placeholder="Введите фамилию"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.last_name && errors.last_name)}
                        errorMessage={errors.last_name}
                    />
                    )}
                </Field>

                {/* Роль */}
                <Field name="role">
                    {() => (
                    <Select
                        label="Роль"
                        labelPlacement="outside"
                        selectedKeys={[values.role]}
                        onChange={(e) => setFieldValue("role", e.target.value)}
                        isInvalid={makeBool(touched.role && errors.role)}
                        errorMessage={errors.role}
                    >
                        <SelectItem key="user" value="user">
                          Пользователь SOS
                        </SelectItem>
                        <SelectItem key="parent" value="parent">
                          Родитель
                        </SelectItem>
                        <SelectItem key="child" value="child">
                          Ребенок
                        </SelectItem>
                        {/* <SelectItem key="tour_agency" value="tour_agency">
                          Тур. агент
                        </SelectItem>
                        <SelectItem key="tourist" value="tourist">
                          Турист
                        </SelectItem> */}
                    </Select>
                    )}
                </Field>

                {/* Email */}
                <Field name="email">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        type="email"
                        label="Электронная почта"
                        placeholder="Введите email"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.email && errors.email)}
                        errorMessage={errors.email}
                    />
                    )}
                </Field>

                {/* Пароль */}
                <Field name="password">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        type="password"
                        label="Пароль"
                        placeholder="Введите пароль"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.password && errors.password)}
                        errorMessage={errors.password}
                    />
                    )}
                </Field>

                {/* Повтор пароля */}
                <Field name="password2">
                    {({ field }: any) => (
                    <Input
                        {...field}
                        type="password"
                        label="Подтвердите пароль"
                        placeholder="Повторите пароль"
                        labelPlacement="outside"
                        isInvalid={makeBool(touched.password2 && errors.password2)}
                        errorMessage={errors.password2}
                    />
                    )}
                </Field>

                {/* Политика конфиденциальности */}
                <div className="py-2 flex flex-col gap-2">
                    <Field name="agree">
                        {({ field }: any) => (
                        <Checkbox
                            isSelected={field.value}
                            onValueChange={(val) => setFieldValue("agree", val)}
                            isInvalid={makeBool(touched.agree && errors.agree)}
                        >
                            <div className="text-xs text-left">
                                Я соглашаюсь с <Link to="" className="text-primary font-medium">политикой конфидециальности</Link>
                            </div>
                        </Checkbox>
                        )}
                    </Field>
                    {errors.agree && <p className="text-danger text-xs">{errors.agree}</p>}
                </div>

                {/* Кнопка */}
                <Button
                    type="submit"
                    color="primary"
                    isDisabled={!isValid || !dirty || isSubmitting}
                    // isLoading={isLoading}
                >
                    Зарегистрироваться
                </Button>

                <Margin direction="b" value={12}/>

                <LoginFallback/>
                </Form>
            )}
        </Formik>
    </div>
  );
}

export default RegisterForm;