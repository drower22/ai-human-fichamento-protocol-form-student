export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });
  try {
    const { filename, json } = req.body ?? {};
    if (typeof filename !== 'string' || !/^S\d{2}_(PILOTO|A\d{2})\.json$/.test(filename))
      return res.status(400).json({ error: 'invalid filename' });
    if (typeof json !== 'string' || json.length > 200000)
      return res.status(400).json({ error: 'invalid payload' });

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Fichamento <onboarding@resend.dev>',
        to: [process.env.TO_EMAIL],
        subject: `Fichamento ${filename.replace('.json', '')}`,
        text: 'Fichamento anexo em JSON.',
        attachments: [{ filename, content: Buffer.from(json, 'utf8').toString('base64') }],
      }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(502).json({ error: data });
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'send failed' });
  }
}
