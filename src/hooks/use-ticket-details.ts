import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import {
  AssignTicketToSelfResponse,
  CloseTicketResponse,
  GetTicketDetailsResponse,
  ResolveTicketResponse,
  TicketPriority,
  UpdateTicketPriorityResponse
} from "../types/ticket";

export function useTicketDetails(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket-details", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<GetTicketDetailsResponse>>(`/tickets/${ticketId}`);
      return unwrapApiResponse(response.data);
    }
  });
}

function invalidateTicketRelatedQueries(queryClient: ReturnType<typeof useQueryClient>, ticketId?: string) {
  queryClient.invalidateQueries({ queryKey: ["ticket-details", ticketId] });
  queryClient.invalidateQueries({ queryKey: ["tickets"] });
}

export function useAssignTicketToSelf(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<AssignTicketToSelfResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const response = await api.post<ApiResponse<AssignTicketToSelfResponse>>(
        `/tickets/${ticketId}/assign`
      );

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      invalidateTicketRelatedQueries(queryClient, ticketId);
    }
  });
}

export function useResolveTicket(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ResolveTicketResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const response = await api.patch<ApiResponse<ResolveTicketResponse>>(
        `/tickets/${ticketId}/resolve`
      );

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      invalidateTicketRelatedQueries(queryClient, ticketId);
    }
  });
}

export function useCloseTicket(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<CloseTicketResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const response = await api.patch<ApiResponse<CloseTicketResponse>>(`/tickets/${ticketId}/close`);

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      invalidateTicketRelatedQueries(queryClient, ticketId);
    }
  });
}

export function useUpdateTicketPriority(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (priority: TicketPriority): Promise<UpdateTicketPriorityResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const response = await api.patch<ApiResponse<UpdateTicketPriorityResponse>>(
        `/tickets/${ticketId}/priority`,
        {
          priority
        }
      );

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      invalidateTicketRelatedQueries(queryClient, ticketId);
    }
  });
}
