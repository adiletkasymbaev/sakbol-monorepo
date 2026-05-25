import z from "zod";
import { ProfileRolesArray } from "../../../shared/enums/ProfileRoles";

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

  role: z.enum(ProfileRolesArray as [string, ...string[]], {
    message: "Роль должна быть валидной"
  }),
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
