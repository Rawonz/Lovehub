import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SuggestionRequest {
  occasion?: string;
  budget?: number;
  interests?: string[];
  partnerName?: string;
}

const FALLBACK_SUGGESTIONS = [
  "A handwritten love letter paired with their favorite flowers.",
  "A customized photo book of your favorite memories together.",
  "A surprise weekend getaway to a place you've both mentioned.",
  "A subscription to a service they love but haven't treated themselves to.",
  "A piece of jewelry engraved with a meaningful date or coordinates.",
  "A home-cooked dinner featuring their favorite meal, with candles and music.",
  "A surprise care package of their favorite snacks and small treats.",
  "A couples' experience: a cooking class, pottery workshop, or dance lesson.",
  "A high-quality version of something they use every day but wouldn't splurge on.",
  "A personalized playlist paired with a vintage-style record frame.",
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = (await req.json().catch(() => ({}))) as SuggestionRequest;
    const occasion = body.occasion?.trim();
    const budget = typeof body.budget === "number" ? body.budget : undefined;
    const interests = Array.isArray(body.interests) ? body.interests.filter(Boolean) : [];

    // Build context-aware suggestions from a local generator. An external LLM
    // could be wired here when an API key is configured.
    const suggestions: string[] = [];

    if (occasion) {
      suggestions.push(
        `For ${occasion}: a thoughtful keepsake that captures the feeling of the moment — engraved, framed, or handwritten.`
      );
    }
    if (interests.length > 0) {
      suggestions.push(
        `Tied to their interests (${interests.slice(0, 3).join(", ")}): a curated experience or tool that levels up something they already love.`
      );
    }
    if (budget != null) {
      if (budget < 25) {
        suggestions.push("A small-but-meaningful gift: a favorite treat, a handwritten note, a pressed flower, or a mixtape-style playlist.");
      } else if (budget < 100) {
        suggestions.push("A mid-range gift: a quality everyday item they wouldn't buy themselves, or a shared experience like a nice dinner out.");
      } else {
        suggestions.push("A splurge gift: a weekend trip, a piece of fine jewelry, or a long-delayed upgrade to something they cherish.");
      }
    }

    // Always include a few evergreen ideas.
    for (const idea of FALLBACK_SUGGESTIONS) {
      if (suggestions.length >= 8) break;
      if (!suggestions.includes(idea)) suggestions.push(idea);
    }

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 8) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
