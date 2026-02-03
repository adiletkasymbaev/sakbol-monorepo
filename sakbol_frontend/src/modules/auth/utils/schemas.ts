import z from "zod";
import { ProfileRolesArray } from "../../../shared/enums/ProfileRoles";
import { getLocalTimeZone, type DateValue } from "@internationalized/date";

export const registerSchema = z.object({
  email: z
    .email("Неверный email"),

  password: z
    .string()
    .min(6, "Минимум 6 символов"),

  first_name: z
    .string()
    .min(2, "Слишком короткое имя")
    .max(50, "Слишком длинное имя"),

  last_name: z
    .string()
    .min(2, "Слишком короткая фамилия")
    .max(50, "Слишком длинная фамилия"),

  birth_date: z
    .custom<DateValue>()
    .superRefine((v, ctx) => {
      if (!v) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Выберите дату рождения",
        });
        return;
      }

      let jsDate: Date;

      try {
        jsDate = v.toDate(getLocalTimeZone());
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Некорректная дата",
        });
        return;
      }

      // Будущее запрещаем
      if (jsDate > new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Дата не может быть в будущем",
        });
      }
    }),

  city: z.string().min(1, "Обязательное поле"),
  street: z.string().min(1, "Обязательное поле"),
  house_number: z.string().min(1, "Обязательное поле"),
  apartment_number: z.string().optional(),

  med_info: z
    .string()
    .max(2000, "Слишком длинное поле")
    .optional(),

  role: z.enum(ProfileRolesArray as [string, ...string[]], {
    message: "Роль должна быть валидной"
  }),

  phone_number: z
    .string()
    .regex(
      /^(\+996\d{9}|\+7\d{10}|\+998\d{9}|\+992\d{9}|\+86\d{10,11})$/,
      "Введите корректный номер телефона в международном формате"
    )
});

export const loginSchema = z.object({
  email: z
    .email("Неверный email"),

  password: z
    .string()
    .min(6, "Минимум 6 символов"),
})

export type RegisterFormType = z.infer<typeof registerSchema>;
export type LoginFormType = z.infer<typeof loginSchema>;