export type UserRole = "user" | "tour_agency" | "tourist" | "parent" | "child";

export const getRoleRepr = (role: UserRole): string => {
  switch (role) {
    case "user":
      return "Пользователь";
    case "tour_agency":
      return "Туристическое агентство";
    case "tourist":
      return "Турист";
    case "parent":
      return "Родитель";
    case "child":
      return "Ребёнок";
    default:
      return "Неизвестная роль";
  }
};