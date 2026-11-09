import { z } from "zod";

// Messages are dictionary keys under `validation.*` so they can be shown in either language.
const uuidOrEmpty = z.union([z.literal(""), z.string().uuid()]).optional().default("");
const phoneDigits = (v: string) => v.replace(/\D/g, "").length;

export const registrationSchema = z
  .object({
    student_name: z.string().trim().min(3, "nameShort").max(120, "nameLong"),
    parent_name: z.string().trim().max(120, "nameLong").optional().default(""),
    age: z.coerce.number({ invalid_type_error: "age" }).int("age").min(1, "age").max(100, "age"),
    phone: z
      .string()
      .trim()
      .min(1, "required")
      .regex(/^[+\d][\d\s()-]*$/, "phone")
      .refine((v) => phoneDigits(v) >= 8 && phoneDigits(v) <= 15, "phone"),
    email: z.union([z.literal(""), z.string().trim().email("email").max(160, "email")]).optional().default(""),
    course_id: uuidOrEmpty,
    experience: z.enum(["none", "basic", "intermediate", "advanced"], { errorMap: () => ({ message: "experience" }) }),
    location_id: uuidOrEmpty,
    preferred_day: z.union([z.literal(""), z.coerce.number().int().min(0).max(6)]).optional().default(""),
    schedule_id: z.string().optional().default(""), // a session uuid, or any|morning|afternoon|evening
    notes: z.string().trim().max(1000, "notesLong").optional().default(""),
    // anti-spam
    website: z.string().max(0).optional().default(""), // honeypot – must stay empty
    started_at: z.coerce.number().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.age < 18 && !v.parent_name?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_name"], message: "parentRequired" });
    }
    if (v.parent_name && v.parent_name.trim().length > 0 && v.parent_name.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parent_name"], message: "nameShort" });
    }
  });

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;

export const reviewSchema = z.object({
  customer_name: z.string().trim().min(2, "nameShort").max(80, "nameLong"),
  rating: z.coerce.number().int().min(1, "rating").max(5, "rating"),
  text: z.string().trim().min(10, "reviewShort").max(800, "reviewLong"),
  course_id: z.union([z.literal(""), z.string().uuid()]).optional().default(""),
  website: z.string().max(0).optional().default(""),
});
export type ReviewInput = z.input<typeof reviewSchema>;
