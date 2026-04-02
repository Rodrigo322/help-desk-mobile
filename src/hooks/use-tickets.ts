import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { createTicketSchema } from "../schemas/tickets/create-ticket-schema";
import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import {
  CreateTicketPayload,
  CreateTicketResponse,
  ListTicketsResponse,
  TicketListingScope
} from "../types/ticket";

const listTicketsFiltersSchema = z.object({
  scope: z.enum(["department", "created", "assigned"]).default("department"),
  status: z.enum(["NEW", "OPEN", "IN_PROGRESS", "PENDING", "ON_HOLD", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10)
});

export type ListTicketsFilters = z.input<typeof listTicketsFiltersSchema>;

function buildTicketsPathByScope(scope: TicketListingScope): string {
  if (scope === "created") {
    return "/tickets/me/created";
  }

  if (scope === "assigned") {
    return "/tickets/me/assigned";
  }

  return "/tickets";
}

function normalizeFilters(filters?: ListTicketsFilters) {
  return listTicketsFiltersSchema.parse(filters ?? {});
}

export function useTickets(filters?: ListTicketsFilters) {
  const normalizedFilters = normalizeFilters(filters);

  return useQuery({
    queryKey: ["tickets", normalizedFilters],
    queryFn: async () => {
      const path = buildTicketsPathByScope(normalizedFilters.scope);
      const { scope, ...params } = normalizedFilters;

      const response = await api.get<ApiResponse<ListTicketsResponse>>(path, { params });
      return unwrapApiResponse(response.data);
    }
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTicketPayload): Promise<CreateTicketResponse> => {
      const parsedPayload = createTicketSchema.parse(payload);
      const response = await api.post<ApiResponse<CreateTicketResponse>>("/tickets", parsedPayload);

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    }
  });
}
