import { z } from "zod";

export const createTicketSchema = z.object({
  title: z.string().min(1, "Informe o titulo."),
  description: z.string().min(1, "Informe a descricao."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"], {
    message: "Selecione uma prioridade."
  }),
  targetDepartmentId: z.string().min(1, "Selecione o departamento de destino.")
});

export type CreateTicketFormData = z.infer<typeof createTicketSchema>;
