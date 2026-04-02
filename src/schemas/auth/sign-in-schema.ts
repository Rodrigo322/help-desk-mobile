import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha.")
});

export type SignInFormData = z.infer<typeof signInSchema>;

