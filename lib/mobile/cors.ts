import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:8081",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "SERVER_ERROR"
  | "MISSING_SUBE"
  | (string & {});

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiErrorBody = {
  message: string;
  code?: ApiErrorCode;
  details?: unknown;
};

export type ApiError = {
  success: false;
  error: ApiErrorBody;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function optionsResponse() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

export function apiSuccess<T>(data: T, status = 200) {
  const body: ApiResponse<T> = { success: true, data };
  return jsonResponse(body, status);
}

export function apiError(
  message: string,
  status = 400,
  code?: ApiErrorCode,
  details?: unknown,
) {
  const body: ApiResponse<never> = {
    success: false,
    error: { message, code, details },
  };
  return jsonResponse(body, status);
}
