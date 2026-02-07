import { NextRequest } from "next/server";
import { success, error, unauthorized, handleError } from "@/lib/api";
import { auth } from "@/lib/auth";
import { supabase, ATTACHMENT_BUCKET } from "@/lib/supabase";
import crypto from "crypto";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

// POST /api/orders/product-image - Upload a product image
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return unauthorized();
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return error("No file provided");
    }

    if (file.size > MAX_FILE_SIZE) {
      return error("File size exceeds 5MB limit");
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return error("Only PNG, JPG, and WEBP images are allowed");
    }

    // Upload to Supabase Storage under product-images/ prefix
    const fileId = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `product-images/${fileId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return error(`Upload failed: ${uploadError.message}`, 500);
    }

    // Get public URL
    const { data } = supabase.storage
      .from(ATTACHMENT_BUCKET)
      .getPublicUrl(storagePath);

    return success({ url: data.publicUrl, storagePath });
  } catch (err) {
    return handleError(err);
  }
}
