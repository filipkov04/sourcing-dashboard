// API Helper Functions for Consistent Responses
// Used across all API routes to ensure standardized response formats

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiSuccessResponse, ApiErrorResponse } from "./types";

/**
 * Create a standardized success response
 * @param data - The data to return
 * @param message - Optional success message
 * @param status - HTTP status code (default: 200)
 */
export function success<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) {
    response.message = message;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a standardized error response
 * @param error - Error message or Error object
 * @param status - HTTP status code (default: 400)
 * @param details - Optional additional error details
 */
export function error(
  error: string | Error,
  status: number = 400,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const errorMessage = error instanceof Error ? error.message : error;

  const response: ApiErrorResponse = {
    success: false,
    error: errorMessage,
  };
  if (details !== undefined) {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}

/**
 * Handle Zod validation errors
 * Returns a 400 response with formatted validation errors
 */
export function validationError(
  zodError: ZodError
): NextResponse<ApiErrorResponse> {
  const formattedErrors = zodError.issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

  return NextResponse.json(
    {
      success: false,
      error: "Validation failed",
      details: formattedErrors,
    },
    { status: 400 }
  );
}

/**
 * Handle unauthorized access (401)
 */
export function unauthorized(
  message: string = "Unauthorized"
): NextResponse<ApiErrorResponse> {
  return error(message, 401);
}

/**
 * Handle forbidden access (403)
 */
export function forbidden(
  message: string = "Forbidden"
): NextResponse<ApiErrorResponse> {
  return error(message, 403);
}

/**
 * Handle not found errors (404)
 */
export function notFound(
  resource: string = "Resource"
): NextResponse<ApiErrorResponse> {
  return error(`${resource} not found`, 404);
}

/**
 * Handle server errors (500)
 */
export function serverError(
  message: string = "Internal server error",
  details?: unknown
): NextResponse<ApiErrorResponse> {
  // Log error details for debugging (in production, send to error tracking service)
  if (process.env.NODE_ENV === "development") {
    console.error("Server Error:", message, details);
  }

  return error(message, 500, details);
}

/**
 * Handle created resource (201)
 */
export function created<T>(
  data: T,
  message?: string
): NextResponse<ApiSuccessResponse<T>> {
  return success(data, message, 201);
}

/**
 * Handle no content (204)
 * Used for successful DELETE operations or updates with no return data
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * Catch-all error handler for API routes
 * Automatically handles different error types
 */
export function handleError(err: unknown): NextResponse<ApiErrorResponse> {
  // Zod validation error
  if (err instanceof ZodError) {
    return validationError(err);
  }

  // Standard Error object
  if (err instanceof Error) {
    // Check for specific error types
    if (err.message.includes("not found")) {
      return notFound();
    }
    if (err.message.includes("unauthorized")) {
      return unauthorized();
    }
    if (err.message.includes("forbidden")) {
      return forbidden();
    }

    return error(err.message);
  }

  // Unknown error type
  return serverError("An unexpected error occurred", err);
}

/**
 * Async error wrapper for API route handlers
 * Automatically catches errors and returns formatted responses
 *
 * @example
 * export const GET = asyncHandler(async (req) => {
 *   const data = await fetchData();
 *   return success(data);
 * });
 */
export function asyncHandler<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      return handleError(err);
    }
  };
}

/**
 * Require authentication middleware for API routes
 * Returns 401 if no session exists
 */
export async function requireAuth(request: Request) {
  const { auth } = await import("@/lib/auth");
  const session = await auth();

  if (!session) {
    throw new Error("unauthorized");
  }

  return session;
}

/**
 * Require specific role for API routes
 * Returns 403 if user doesn't have required role
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[]
) {
  const session = await requireAuth(request);

  if (!allowedRoles.includes(session.user.role)) {
    throw new Error("forbidden");
  }

  return session;
}
