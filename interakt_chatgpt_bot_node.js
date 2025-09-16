require('dotenv').config();
const fs = require('fs');
const express = require('express');
const { OpenAI } = require('openai');

const app = express();
app.use(express.json({ limit: '256kb' }));

// Load mentor-style prompt
let SYSTEM_PROMPT = '';
try {
  SYSTEM_PROMPT = fs.readFileSync('teacher_style_prompt.txt', 'utf8').trim();
  console.log('✅ Loaded teacher_style_prompt.txt');
} catch (e) {
  console.warn('⚠️ Using fallback system prompt.');
  SYSTEM_PROMPT = "You are CA Dreamers Mentor. Use Hinglish. Only CA Inter Super 30 related replies. Structure = Pain → Dream → Value → Visualisation → Scarcity → Punch.";
}

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Root check
app.get('/', (_req, res) => res.send('✅ CA Dreamers ChatGPT (Mentor) is Live!'));
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const userMessage = String(req.body?.message ?? '').trim();
  if (!userMessage) return res.status(400).json({ error: 'message is required' });

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 450,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || 
      "🙏 Sorry Dreamer, abhi reply nahi de pa raha.";
    res.json({ reply });
  } catch (err) {
    console.error('❌ OpenAI error:', err.message);
    res.status(500).json({ error: 'AI service error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Bot running on port ${PORT}`));
