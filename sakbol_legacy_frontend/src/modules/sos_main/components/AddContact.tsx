// @ts-nocheck
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Button, Input } from "@heroui/react";
import { addToast } from "@heroui/react";
import { useSendContactRequestMutation } from "../../../features/contacts/contactsApi";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

// ✅ Валидация через Yup
const AddContactSchema = Yup.object().shape({
  identifier: Yup.string()
    .trim()
    .matches(/^[0-9]{2}[A-Za-zА-Яа-я]{4}$/, "Код должен состоять из 6 символов (ЦЦББББ)")
    .required("Введите код контакта"),
});

function AddContact() {
  const [sendContactRequest, { isLoading }] = useSendContactRequestMutation();

  const handleSubmit = async (values: { identifier: string }, { resetForm }) => {
    try {
      await sendContactRequest(values.identifier).unwrap();
      addToast({
        title: ToastTypes.OK,
        description: "Заявка отправлена.",
        color: "success",
      });
      resetForm();
    } catch (err: any) {
      const detail =
        err?.data?.identifier?.[0] ||
        err?.data?.detail ||
        "Не удалось отправить заявку.";
      addToast({
        title: ToastTypes.ERR,
        description: detail,
        color: "danger",
      });
    }
  };

  return (
    <Formik
      initialValues={{ identifier: "" }}
      validationSchema={AddContactSchema}
      onSubmit={handleSubmit}
    >
      {({ errors, handleSubmit, values, handleChange }) => (
        <Form onSubmit={handleSubmit}>
          <div className="flex gap-2 items-start">
            <Input
              name="identifier"
              placeholder="Введите код контакта (ККББББ)"
              value={values.identifier}
              onChange={handleChange}
            />

            <Button
              isIconOnly
              color="secondary"
              type="submit"
              isLoading={isLoading}
              isDisabled={!values.identifier || !!errors.identifier}
            >
              <span className="text-2xl mb-[5px]">+</span>
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
}

export default AddContact;