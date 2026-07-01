#!/usr/bin/env node
// Testa a integração com o Telegram sem subir a API.
// Uso: node --env-file=.env scripts/telegram-test.mjs
//   (ou defina TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID no ambiente)

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('❌ Defina TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID (ex.: node --env-file=.env scripts/telegram-test.mjs).');
  process.exit(1);
}

const api = (method) => `https://api.telegram.org/bot${token}/${method}`;

async function send(text, threadId) {
  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  };
  if (threadId) payload.message_thread_id = Number(threadId);

  const res = await fetch(api('sendMessage'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!body.ok) throw new Error(JSON.stringify(body));
  return body.result.message_id;
}

async function main() {
  console.log('🔎 Verificando o bot...');
  const me = await (await fetch(api('getMe'))).json();
  if (!me.ok) throw new Error('getMe falhou: ' + JSON.stringify(me));
  console.log(`✅ Bot: @${me.result.username} (${me.result.first_name})`);

  const now = new Date().toISOString();
  const cases = [
    ['support', process.env.TELEGRAM_THREAD_SUPPORT, 'ℹ️', 'INFO / Suporte'],
    ['alerts', process.env.TELEGRAM_THREAD_ALERTS, '🚨', 'ERRO / Alertas'],
    ['debug', process.env.TELEGRAM_THREAD_DEBUG, '🔍', 'DEBUG'],
  ];

  for (const [name, thread, emoji, label] of cases) {
    process.stdout.write(`→ enviando teste para "${name}"${thread ? ` (thread ${thread})` : ''}... `);
    const id = await send(
      `<b>${emoji} FLUI API · Teste [${label}]</b>\n` +
        `<b>🌍 Ambiente:</b> <code>${(process.env.NODE_ENV ?? 'local').toUpperCase()}</code>\n` +
        `<b>💬 Mensagem:</b>\n<pre>Mensagem de teste do monitoramento (${name}).</pre>\n` +
        `<i>⏰ ${now}</i>`,
      thread,
    );
    console.log(`ok (message_id ${id})`);
  }

  console.log('\n✅ Todos os testes foram enviados. Confira o grupo no Telegram.');
}

main().catch((e) => {
  console.error('❌ Falhou:', e.message);
  process.exit(1);
});
