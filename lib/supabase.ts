import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env"
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const ATTACHMENT_BUCKET = "order-attachments";
export const CHAT_ATTACHMENT_BUCKET = "chat-attachments";

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(ATTACHMENT_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

export function getChatAttachmentUrl(path: string): string {
  const { data } = supabase.storage
    .from(CHAT_ATTACHMENT_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
