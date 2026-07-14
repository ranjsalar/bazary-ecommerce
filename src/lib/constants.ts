// All Iraq governorate capitals + major KRG cities, used for the checkout
// city dropdown and delivery fee management.
export const IRAQ_CITIES = [
  "Baghdad",
  "Erbil",
  "Sulaymaniyah",
  "Duhok",
  "Halabja",
  "Kirkuk",
  "Mosul",
  "Basra",
  "Najaf",
  "Karbala",
  "Hillah",
  "Ramadi",
  "Fallujah",
  "Tikrit",
  "Samarra",
  "Baqubah",
  "Kut",
  "Amarah",
  "Nasiriyah",
  "Diwaniyah",
  "Samawah",
  "Zakho",
  "Soran",
  "Ranya",
  "Kalar",
  "Chamchamal",
] as const;

export type IraqCity = (typeof IRAQ_CITIES)[number];

export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

// Display names come from the i18n dictionaries (status.*); these colors are
// shared by the storefront and admin badges.
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-400",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-400",
  SHIPPED: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400",
};

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const TOKEN_TYPES = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  VERIFY_PHONE: "VERIFY_PHONE",
  PASSWORD_RESET: "PASSWORD_RESET",
} as const;
