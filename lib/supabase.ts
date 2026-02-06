import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const ATTACHMENT_BUCKET = "order-attachments";

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from(ATTACHMENT_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}
