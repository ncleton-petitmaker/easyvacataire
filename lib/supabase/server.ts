import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _serviceClient: SupabaseClient;

export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    _serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _serviceClient;
}
