import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createCommentSchema } from "../schemas/tickets/comment-schema";
import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import {
  CreateTicketCommentPayload,
  CreateTicketCommentResponse,
  ListTicketCommentsResponse
} from "../types/comment";

type UseTicketCommentsInput = {
  includeInternal?: boolean;
};

export function useTicketComments(ticketId?: string, input?: UseTicketCommentsInput) {
  return useQuery({
    queryKey: ["ticket-comments", ticketId, input?.includeInternal ?? false],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListTicketCommentsResponse>>(
        `/tickets/${ticketId}/comments`,
        {
          params: {
            ...(input?.includeInternal ? { includeInternal: true } : {})
          }
        }
      );

      return unwrapApiResponse(response.data);
    }
  });
}

export function useCreateTicketComment(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTicketCommentPayload): Promise<CreateTicketCommentResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const parsedPayload = createCommentSchema.parse(payload);
      const response = await api.post<ApiResponse<CreateTicketCommentResponse>>(
        `/tickets/${ticketId}/comments`,
        parsedPayload
      );

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-comments", ticketId] });
    }
  });
}
