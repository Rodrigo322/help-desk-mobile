import { useQuery } from "@tanstack/react-query";

import { api, unwrapApiResponse } from "../services/api";
import { ApiResponse } from "../types/api";
import { ListDepartmentsResponse } from "../types/department";

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ListDepartmentsResponse>>("/departments");
      return unwrapApiResponse(response.data);
    }
  });
}
