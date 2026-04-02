import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import {
  ListTicketAttachmentsResponse,
  UploadableFile,
  UploadAttachmentResponse
} from "../types/attachment";

export function useTicketAttachments(ticketId?: string) {
  return useQuery({
    queryKey: ["ticket-attachments", ticketId],
    enabled: Boolean(ticketId),
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListTicketAttachmentsResponse>>(
        `/tickets/${ticketId}/attachments`
      );

      return unwrapApiResponse(response.data);
    }
  });
}

export function useUploadTicketAttachment(ticketId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: UploadableFile): Promise<UploadAttachmentResponse> => {
      if (!ticketId) {
        throw new Error("Ticket id is required.");
      }

      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType
      } as unknown as Blob);

      const response = await api.post<ApiResponse<UploadAttachmentResponse>>(
        `/tickets/${ticketId}/attachments`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        }
      );

      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-attachments", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["ticket-details", ticketId] });
    }
  });
}
