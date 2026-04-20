import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 800;
const MAX_RETRIES = 3;

const SYSTEM_PROMPT = `Eres un extractor estructurado de reseñas de baños de establecimientos. Tu trabajo es leer una reseña en español (texto + checkboxes + rating) y devolver un JSON con dimensiones evaluables.

PRINCIPIOS:
- Solo extraes lo que el usuario dice o implica razonablemente. NUNCA inventes datos.
- Si una dimensión no se menciona, su valor es null. No asumas.
- Los checks booleanos del usuario SON FUENTE DE VERDAD. Úsalos directamente.
- Sé determinista: mismo input → mismo output.
- Sin juicios morales. Sin coaching al usuario.

DIMENSIONES:
- cleanliness: 0-10 o null
- supplies: {soap, paper, dryer_working, toilet_seat} con true/false/null cada uno
- accessibility: {baby_changer, wheelchair} con true/false/null
- smell: 0-10 (10=sin olor) o null
- privacy: 0-10 o null
- safety: 0-10 o null
- tags: array de máx 6 strings cortos en español (ej: "limpio", "sin_jabón")
- overall_sentiment: "positive" | "negative" | "mixed" | "neutral"
- flags: array de strings. Posibles: "possible_spam", "off_topic", "offensive_language", "too_short", "contradictory"

OUTPUT: JSON válido EXCLUSIVAMENTE con esta forma:
{
  "cleanliness": <int|null>,
  "supplies": {"soap": <bool|null>, "paper": <bool|null>, "dryer_working": <bool|null>, "toilet_seat": <bool|null>},
  "accessibility": {"baby_changer": <bool|null>, "wheelchair": <bool|null>},
  "smell": <int|null>,
  "privacy": <int|null>,
  "safety": <int|null>,
  "tags": [<string>, ...],
  "overall_sentiment": <string>,
  "flags": [<string>, ...]
}

NO incluyas texto fuera del JSON. NO uses markdown fences.`;

function buildUserPrompt(review: any): string {
  const checks: Record<string, any> = {
    has_paper: review.has_paper,
    has_soap: review.has_soap,
    has_brush: review.has_brush,
    required_order: review.required_order,
  };
  if (review.extras?.length) {
    checks.extras = review.extras;
  }

  return `Reseña a analizar:

Rating del usuario: ${review.rating}/5 cacas
Checks marcados por el usuario: ${JSON.stringify(checks)}
Texto libre:
"""
${review.comment || "(sin texto)"}
"""`;
}

function validateExtraction(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;
  if (!("overall_sentiment" in obj)) return false;
  if (!Array.isArray(obj.tags)) return false;
  if (!Array.isArray(obj.flags)) return false;
  const validSentiments = ["positive", "negative", "mixed", "neutral"];
  if (!validSentiments.includes(obj.overall_sentiment)) return false;
  return true;
}

async function callClaude(
  apiKey: string,
  userPrompt: string,
): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(ANTHROPIC_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      if (res.status >= 400 && res.status < 500) {
        const body = await res.text();
        throw new Error(`Claude API ${res.status}: ${body}`);
      }

      if (!res.ok) {
        throw new Error(`Claude API ${res.status}`);
      }

      const data = await res.json();
      return data.content?.[0]?.text || "";
    } catch (e) {
      lastError = e as Error;
      if ((e as any)?.message?.includes("4")) throw e;
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt)));
      }
    }
  }

  throw lastError || new Error("Claude API failed after retries");
}

function parseJsonResponse(raw: string): any {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(cleaned);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");

  if (!anthropicKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let reviewId: string;
  try {
    const body = await req.json();
    reviewId = body.review_id;
    if (!reviewId) throw new Error("missing review_id");
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Invalid request: " + (e as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 1. Read review
  const { data: review, error: readErr } = await supabase
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();

  if (readErr || !review) {
    return new Response(
      JSON.stringify({ error: `Review ${reviewId} not found` }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // 2. Mark as processing
  await supabase
    .from("reviews")
    .update({ extraction_status: "processing" })
    .eq("id", reviewId);

  try {
    // 3. Build prompt and call Claude
    const userPrompt = buildUserPrompt(review);
    const rawResponse = await callClaude(anthropicKey, userPrompt);

    // 4. Parse and validate
    const extraction = parseJsonResponse(rawResponse);
    if (!validateExtraction(extraction)) {
      throw new Error("Invalid extraction schema");
    }

    // 5. Determine moderation status based on flags
    const flagsToModerate = ["offensive_language", "possible_spam", "off_topic"];
    const needsReview = Array.isArray(extraction.flags) &&
      extraction.flags.some((f: string) => flagsToModerate.includes(f));
    const moderationStatus = needsReview ? "pending_review" : "visible";

    // 6. Save successful extraction
    await supabase
      .from("reviews")
      .update({
        structured_extraction: extraction,
        extracted_at: new Date().toISOString(),
        extraction_version: "v1",
        extraction_status: "done",
        extraction_error: null,
        moderation_status: moderationStatus,
      })
      .eq("id", reviewId);

    // 7. Si se marca pending_review, revertir XP y contadores
    // Asi el usuario no se queda con XP de una opinion que no se publicara.
    if (needsReview && review.user_id) {
      try {
        // Revertir XP base (~20 XP, no sabemos bonus exacto pero es
        // el valor mas comun). Decrementar total_reviews.
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("xp, total_reviews")
          .eq("id", review.user_id)
          .maybeSingle();

        if (profile) {
          const newXp = Math.max(0, (profile.xp || 0) - 20);
          const newTotal = Math.max(0, (profile.total_reviews || 0) - 1);
          await supabase
            .from("user_profiles")
            .update({ xp: newXp, total_reviews: newTotal })
            .eq("id", review.user_id);
        }

        // Recalcular agregados del place sin reviews ocultas
        const { data: visibleReviews } = await supabase
          .from("reviews")
          .select("rating")
          .eq("place_id", review.place_id)
          .or("moderation_status.eq.visible,moderation_status.is.null");

        if (visibleReviews) {
          const count = visibleReviews.length;
          const avg = count > 0
            ? visibleReviews.reduce((s, r) => s + (r.rating || 0), 0) / count
            : 0;
          await supabase
            .from("places")
            .update({
              avg_rating: Math.round(avg * 10) / 10,
              review_count: count,
            })
            .eq("id", review.place_id);
        }
      } catch (reversalErr) {
        console.error("[extract-review] XP reversal error:", reversalErr);
      }
    }

    return new Response(
      JSON.stringify({ status: "done", moderation: moderationStatus, extraction }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const errorMsg = (e as Error).message || "Unknown error";

    // Save failure
    await supabase
      .from("reviews")
      .update({
        extraction_status: "failed",
        extraction_error: errorMsg.slice(0, 500),
      })
      .eq("id", reviewId);

    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
