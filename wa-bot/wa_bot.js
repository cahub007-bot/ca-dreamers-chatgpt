require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');
const fs = require('fs');

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './.wwebjs_auth' }),
  puppeteer: { headless:true, args:['--no-sandbox','--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  console.log("📲 Scan this QR on Render logs (Settings ▸ Linked Devices).");
});

client.on('ready', () => {
  console.log("✅ WhatsApp Bot is ready on Render!");
});

client.on('message', async (msg)=>{
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey){ await msg.reply("⚠️ AI disabled. Set OPENAI_API_KEY"); return; }

  try{
    const prompt = fs.readFileSync('../teacher_style_prompt.txt','utf8');
    const resp=await axios.post("https://api.openai.com/v1/chat/completions",{
      model:process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages:[{role:"system",content:prompt},{role:"user",content:msg.body}],
      temperature:0.7,max_tokens:400
    },{headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json"}});
    await msg.reply(resp.data.choices[0].message.content.trim());
  }catch(e){await msg.reply("🙏 Sorry Dreamer, abhi reply nahi de pa raha.");}
});

client.initialize();
