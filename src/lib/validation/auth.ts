import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码长度至少为8位")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/,
      "密码只可包含英文和数字，并且需同时包含英文和数字"
    ),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = loginSchema
  .extend({
    name: z.string(),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^1[3-9]\d{9}$/.test(val), "请输入有效的手机号"),
    confirmPassword: z
      .string()
      .min(8, "密码长度至少为8位")
      .regex(
        /^(?=.*[a-zA-Z])(?=.*\d)[a-zA-Z\d]+$/,
        "密码只可包含英文和数字，并且需同时包含英文和数字"
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;
