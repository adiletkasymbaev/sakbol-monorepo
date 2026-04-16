import { z } from "zod";

// Схема создания группы
export const createTourGroupSchema = z.object({
  name: z.string().min(3, "Название должно быть не менее 3 символов").max(100),
  description: z.string().max(500, "Описание не более 500 символов").optional(),
});

export type CreateTourGroupFormType = z.infer<typeof createTourGroupSchema>;

// Схема создания зоны
export const createTourZoneSchema = z.object({
  name: z.string().min(3, "Название должно быть не менее 3 символов").max(100),
  description: z.string().max(500).optional(),
  polygon: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    })
  ).min(3, "Полигон должен содержать минимум 3 точки"),
  center_lat: z.number(),
  center_lng: z.number(),
});

export type CreateTourZoneFormType = z.infer<typeof createTourZoneSchema>;

// Схема начала тура
export const startTourSchema = z.object({
  duration_minutes: z.number().min(1).max(1440).default(60),
});

export type StartTourFormType = z.infer<typeof startTourSchema>;

// Схема вступления в группу
export const joinGroupSchema = z.object({
  invite_code: z.string().length(6, "Код должен содержать 6 символов").toUpperCase(),
});

export type JoinGroupFormType = z.infer<typeof joinGroupSchema>;
