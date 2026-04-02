import { api, unwrapApiResponse } from "./api";
import { ApiResponse } from "../types/api";
import { SessionProfileResponse, SignInPayload, SignInResponse } from "../types/auth";

export async function signIn(payload: SignInPayload): Promise<SignInResponse> {
  const response = await api.post<ApiResponse<SignInResponse>>("/sessions", payload);
  return unwrapApiResponse(response.data);
}

export async function getSessionProfile(): Promise<SessionProfileResponse> {
  const response = await api.get<ApiResponse<SessionProfileResponse>>("/me");
  return unwrapApiResponse(response.data);
}
