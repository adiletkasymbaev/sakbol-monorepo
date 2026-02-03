import { z } from "zod";

export const addContactSchema = z.object({
  identifier: z
    .string()
    .length(6, "Код должен состоять из 6 символов")
    .regex(/^[A-Z0-9]{6}$/, "Разрешены только цифры и буквы"),
});

export type AddContactFormType = z.infer<typeof addContactSchema>;