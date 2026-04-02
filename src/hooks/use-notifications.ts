import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import {
  ListMyNotificationsResponse,
  MarkAllMyNotificationsAsReadResponse,
  MarkNotificationAsReadResponse
} from "../types/notification";

export function useMyNotifications(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "me"],
    enabled,
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListMyNotificationsResponse>>("/notifications/me");
      return unwrapApiResponse(response.data);
    }
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string): Promise<MarkNotificationAsReadResponse> => {
      const response = await api.patch<ApiResponse<MarkNotificationAsReadResponse>>(
        `/notifications/${notificationId}/read`
      );
      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "me"] });
    }
  });
}

export function useMarkAllMyNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<MarkAllMyNotificationsAsReadResponse> => {
      const response = await api.patch<ApiResponse<MarkAllMyNotificationsAsReadResponse>>(
        "/notifications/me/read-all"
      );
      return unwrapApiResponse(response.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "me"] });
    }
  });
}
