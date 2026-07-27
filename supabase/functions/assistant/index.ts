import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AssistantRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
  context?: {
    partnerName?: string;
    daysTogether?: number;
    upcomingAnniversary?: string;
  };
}

const SUGGESTION_BANK: { match: RegExp; replies: string[] }[] = [
  {
    match: /date (idea|night|plan)/i,
    replies: [
      "Try a sunset picnic with your favorite playlist and a shared dessert — simple, memorable, and low-pressure.",
      "A themed home-cooking night: pick a cuisine together, shop for ingredients, and cook it side by side.",
      "A 'no-phones' walk somewhere new, ending at a café you've never tried.",
      "Recreate your first date, but add one small surprise to make it fresh.",
    ],
  },
  {
    match: /gift/i,
    replies: [
      "A personalized gift often lands hardest — engraved coordinates of where you met, or a photo book of your year.",
      "Give an experience rather than a thing: a class, a weekend trip, or a reservations-only dinner.",
      "A 'reasons I love you' jar — 52 notes, one to open each week — is thoughtful and lasts a year.",
      "Upgrade something they use daily but wouldn't splurge on themselves.",
    ],
  },
  {
    match: /(sweet|romantic|love) message/i,
    replies: [
      "Try: 'Even on ordinary days with you, I catch myself feeling lucky.'",
      "Try: 'I love the way you make small moments feel like ones I'll remember.'",
      "Try: 'You're my favorite part of every day — even the quiet ones.'",
      "Try: 'Loving you is the easiest thing I've ever done.'",
    ],
  },
  {
    match: /anniversar/i,
    replies: [
      "Mark the day with a ritual you can repeat each year — a letter, a photo in the same spot, or a shared meal at 'your' place.",
      "Plan something that echoes your story: revisit where it started, or do the thing you always say you'll do 'someday.'",
      "A handwritten note paired with a small keepsake often means more than a big gift.",
      "Make it a full day, not just a dinner — start with breakfast in bed and build from there.",
    ],
  },
  {
    match: /argument|fight|conflict/i,
    replies: [
      "Try a 'repair' conversation: acknowledge the other person's feelings first, before explaining your own.",
      "Use 'I' statements — 'I felt unheard when…' lands softer than 'You never…'",
      "Take a 20-minute breather if emotions spike, then come back. Cool-downs prevent saying things you'll regret.",
      "Ask: 'What do you need from me right now?' Sometimes the answer is closeness, not a solution.",
    ],
  },
];

const GENERIC_REPLIES = [
  "I'm here to help your relationship thrive. I can suggest date ideas, gifts, sweet messages, or ways to mark an anniversary — just ask.",
  "That's a lovely thing to think about. Want me to suggest a date idea, a gift, or a sweet message for your partner?",
  "Tell me a little more and I'll tailor my suggestion — are we planning something together, or is it a surprise?",
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

    const body = (await req.json().catch(() => ({}))) as AssistantRequest;
    const message = (body.message ?? '').trim();
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Match against the suggestion bank.
    let reply = '';
    for (const entry of SUGGESTION_BANK) {
      if (entry.match.test(message)) {
        reply = entry.replies[Math.floor(Math.random() * entry.replies.length)];
        break;
      }
    }
    if (!reply) {
      reply = GENERIC_REPLIES[Math.floor(Math.random() * GENERIC_REPLIES.length)];
    }

    // Personalize with context when available.
    if (body.context?.partnerName) {
      reply = reply.replace(/your partner/g, body.context.partnerName);
    }

    // Simulate a brief thinking delay is unnecessary server-side; respond fast.
    return new Response(
      JSON.stringify({ reply }),
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
