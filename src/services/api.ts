import axios, { AxiosError } from "axios";
import { Platform } from "react-native";

import { ApiResponse } from "../types/api";
import { clearAuthSession, getAuthToken } from "../utils/storage";

const rawBaseURL = (process.env.EXPO_PUBLIC_API_URL ?? "").trim().replace(/\/+$/, "");

function normalizeBaseURL(url: string) {
  if (!url) {
    return url;
  }

  if (Platform.OS === "android") {
    return url
      .replace("://localhost", "://10.0.2.2")
      .replace("://127.0.0.1", "://10.0.2.2");
  }

  return url;
}

const baseURL = normalizeBaseURL(rawBaseURL);

if (!baseURL) {
  console.warn("[mobile] EXPO_PUBLIC_API_URL is missing. Configure it in your .env file.");
}

if (rawBaseURL.includes("localhost") || rawBaseURL.includes("127.0.0.1")) {
  console.warn(
    "[mobile] EXPO_PUBLIC_API_URL uses localhost/127.0.0.1. On physical device use your computer LAN IP, example: http://192.168.0.10:3333/v1."
  );
}

let unauthorizedHandler: (() => void) | null = null;

export const api = axios.create({
  baseURL
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401 && unauthorizedHandler) {
      await clearAuthSession();
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function unwrapApiResponse<T>(payload: ApiResponse<T>): T {
  if (!payload.success) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;

    if (message) {
      return message;
    }

    if (!error.response) {
      return "Nao foi possivel conectar ao backend. Verifique EXPO_PUBLIC_API_URL e use o IP local da maquina no celular.";
    }

    if (error.response.status === 401) {
      return "Sessao expirada. Faca login novamente.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido.";
}
