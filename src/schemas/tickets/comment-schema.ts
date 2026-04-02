import { z } from "zod";

export const createCommentSchema = z.object({
  content: z.string().min(1, "Informe o comentario."),
  isInternal: z.boolean().optional()
});

export type CreateCommentFormData = z.infer<typeof createCommentSchema>;
