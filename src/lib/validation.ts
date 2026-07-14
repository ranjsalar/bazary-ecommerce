import { z } from "zod";
import { IRAQ_CITIES } from "./constants";

// Iraqi mobile numbers: +964 followed by 7XXXXXXXXX (10 digits starting with 7).
// Accepts "+9647701234567", "009647701234567", "07701234567" and normalizes
// to "+9647701234567".
export const iraqPhoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .transform((v) => {
    if (v.startsWith("00964")) return "+964" + v.slice(5);
    if (v.startsWith("964")) return "+" + v;
    if (v.startsWith("07")) return "+964" + v.slice(1);
    return v;
  })
  .pipe(
    z
      .string()
      .regex(/^\+9647\d{9}$/, "errors.phoneInvalid")
  );

export const registerSchema = z.object({
  name: z.string().trim().min(2, "errors.nameMin").max(100),
  email: z.string().trim().toLowerCase().email("errors.emailInvalid"),
  phone: iraqPhoneSchema,
  password: z.string().min(8, "errors.passwordMin").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("errors.emailInvalid"),
  password: z.string().min(1, "errors.passwordRequired"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("errors.emailInvalid"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "errors.passwordMin").max(100),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "errors.nameMin").max(100),
  phone: iraqPhoneSchema,
});

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "errors.fullNameRequired").max(100),
  whatsapp: iraqPhoneSchema,
  city: z.enum(IRAQ_CITIES, { message: "errors.cityRequired" }),
  district: z.string().trim().min(2, "errors.districtRequired").max(200),
  landmark: z.string().trim().max(200).optional().or(z.literal("")),
  addressNotes: z.string().trim().max(500).optional().or(z.literal("")),
  orderNotes: z.string().trim().max(500).optional().or(z.literal("")),
  // 6-digit WhatsApp verification code; enforced server-side when the
  // store's checkout-OTP setting is on.
  otpCode: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "errors.cartEmpty"),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1, "errors.descriptionRequired"),
  price: z.coerce.number().int().min(0, "errors.priceMin"),
  compareAt: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0),
  categoryId: z.string().min(1, "errors.categoryRequired"),
  featured: z.coerce.boolean(),
  active: z.coerce.boolean(),
});

export const deliveryFeeSchema = z.object({
  city: z.string().trim().min(2, "errors.cityNameRequired").max(100),
  fee: z.coerce.number().int().min(0, "errors.feeMin"),
  active: z.coerce.boolean(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(100),
});

// Flattens a zod error into { fieldName: firstMessage } for form display.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
