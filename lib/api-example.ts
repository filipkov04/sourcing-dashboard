/**
 * API Helper Usage Examples
 * This file shows how to use the API helpers in your route handlers
 *
 * DELETE THIS FILE after you understand how to use the helpers
 */

import { NextRequest } from "next/server";
import {
  success,
  created,
  error,
  notFound,
  asyncHandler,
  requireAuth,
  requireRole,
} from "./api";

// ============================================
// EXAMPLE 1: Simple GET endpoint
// ============================================
export const GET = asyncHandler(async (req: NextRequest) => {
  // Fetch data
  const data = { message: "Hello World" };

  // Return success response
  return success(data);
});

// ============================================
// EXAMPLE 2: POST endpoint with validation
// ============================================
export const POST = asyncHandler(async (req: NextRequest) => {
  // Parse and validate request body
  const body = await req.json();

  // If validation fails, Zod will throw an error
  // asyncHandler will catch it and return a validation error response

  // Create resource
  const newResource = { id: "123", ...body };

  // Return 201 Created
  return created(newResource, "Resource created successfully");
});

// ============================================
// EXAMPLE 3: Protected endpoint (require auth)
// ============================================
export const PATCH = asyncHandler(async (req: NextRequest) => {
  // Require authentication
  const session = await requireAuth(req);

  // Update resource
  const updated = { id: "123", updatedBy: session.user.id };

  return success(updated, "Updated successfully");
});

// ============================================
// EXAMPLE 4: Admin-only endpoint
// ============================================
export const DELETE = asyncHandler(async (req: NextRequest) => {
  // Require admin or owner role
  await requireRole(req, ["ADMIN", "OWNER"]);

  // Delete resource
  // ... deletion logic

  return success({ deleted: true }, "Resource deleted");
});

// ============================================
// EXAMPLE 5: Manual error handling
// ============================================
export async function manualExample(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return error("ID is required", 400);
  }

  // Try to find resource
  const resource = null; // Simulate not found

  if (!resource) {
    return notFound("Resource");
  }

  return success(resource);
}

/**
 * QUICK REFERENCE:
 *
 * success(data, message?, status?)     - 200 OK
 * created(data, message?)              - 201 Created
 * noContent()                          - 204 No Content
 *
 * error(message, status?, details?)    - Custom error
 * validationError(zodError)            - 400 Validation error
 * unauthorized(message?)               - 401 Unauthorized
 * forbidden(message?)                  - 403 Forbidden
 * notFound(resource?)                  - 404 Not Found
 * serverError(message?, details?)      - 500 Server Error
 *
 * asyncHandler(handler)                - Auto error handling wrapper
 * requireAuth(request)                 - Require authentication
 * requireRole(request, roles[])        - Require specific role
 */
