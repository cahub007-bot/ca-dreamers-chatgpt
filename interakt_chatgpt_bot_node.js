require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json({ limit: '256kb' }));

// Load Teacher–Mentor style prompt
let SYSTEM_PROMPT = "You are a Teacher + Mentor for CA students (Hinglish).";
try { SYSTEM_PROMPT = fs.readFileSync('teacher_style_prompt.txt','utf8'); } catch {}

// Seat-first policy (no fees until tentative seat approval)
const SEAT_POLICY =
  "IMPORTANT POLICY: Never reveal fees. First do a short assessment, then check seat availability (only 30 seats). " +
  "If student asks fees again, politely restate policy and move the funnel forward. Keep tone Caring, Inspiring, Guiding, Strong.";

// Funnel guide for consistent flow
const FUNNEL =
  "Funnel: 1) Name 2) Attempt month (Jan/May/Sep) 3) Group (G1/G2/Both) 4) First-time or repeater 5) Seriousness → " +
  "then say you will check seat availability. If tentatively approved, say: 'Fees will be shared on mentor call.'";

// Quick replies (no fees)
function quickReply(text) {
  const t = (text || '').toLowerCase();
  if (t.includes("fees") || t.includes("fee") || t.includes("admission") || t.includes("apply")
      || t.includes("enroll") || t.includes("join") || t.includes("seat")) {
    return (
      "⚠️ Super 30 me seats sirf 30 hoti hain.\n" +
      "Process: 1) Short assessment 2) Seat availability check 3) Phir next step.\n" +
      "Chalo 60-sec me qualify karte hain:\n" +
      "• Aapka naam?\n" +
      "• Attempt month (Jan/May/Sep)?\n" +
      "• Group (G1/G2/Both)?\n" +
      "• First time ya repeater?\n" +
      "Note: Fees sirf tentatively seat approve hone ke baad share hoti hai.\n" +
      "Apply/WhatsApp: https://cadreamers.com/apply | +91 9354719404"
    );
  }
  if (t.includes("website"))   return "🌐 Website: https://cadreamers.com";
  if (t.includes("contact") || t.includes("phone") || t.includes("whatsapp"))
    return "📲 WhatsApp/Phone: +91 9354719404";
  if (t.includes("youtube"))   return "▶️ YouTube: @CADreamersTheAvenger";
  if (t.includes("instagram") || t.includes("insta"))
    return "📸 Instagram: @vinit_mishra007";
  return null;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Health
app.get('/', (_req, res) => res.send('✅ CA Dreamers Server (Seat-first policy enabled)'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Main webhook: { "message": "user text..." }
app.post('/webhook', async (req, res) => {
  const userMessage = String(req.body?.message ?? '').trim();
  if (!userMessage) return res.status(400).json({ error: 'message required' });

  // Quick path (no model call) – enforces seat-first gatekeeping
  const qr = quickReply(userMessage);
  if (qr) return res.json({ reply: qr });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 450,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + "\n\n" + SEAT_POLICY + "\n" + FUNNEL },
        { role: 'user', content: userMessage }
      ]
    });
    const reply = completion.choices?.[0]?.message?.content?.trim() || "🙏 Sorry, no reply.";
    res.json({ reply });
  } catch (e) {
    console.error("OpenAI error:", e?.response?.data || e.message);
    // Seat-first fallback (no fees)
    return res.json({
      reply:
        "🙏 AI busy hai, lekin process simple hai:\n" +
        "1) Short assessment 2) Seat availability check (30 seats) 3) Phir next step.\n" +
        "Reply karo: Naam, Attempt month (Jan/May/Sep), Group (G1/G2/Both), First time/Repeater.\n" +
        "Apply/WhatsApp: https://cadreamers.com/apply | +91 9354719404"
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on ${PORT} (seat-first policy on)`));
