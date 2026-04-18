import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES_MS = 2000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Find pending reviews
  const { data: pending, error } = await supabase
    .from("reviews")
    .select("id")
    .or("extraction_status.eq.pending,extraction_status.is.null")
    .order("date", { ascending: false })
    .limit(BATCH_SIZE);

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (!pending?.length) {
    return new Response(
      JSON.stringify({ status: "done", processed: 0, message: "No pending reviews" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const extractUrl = `${supabaseUrl}/functions/v1/extract-review`;
  let processed = 0;
  let failed = 0;

  for (const review of pending) {
    try {
      const res = await fetch(extractUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ review_id: review.id }),
      });

      if (res.ok) {
        processed++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }

    // Delay between calls to avoid rate limiting
    if (pending.indexOf(review) < pending.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  return new Response(
    JSON.stringify({
      status: "done",
      total: pending.length,
      processed,
      failed,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
