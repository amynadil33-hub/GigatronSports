import nodemailer from 'nodemailer';

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] || character);

export async function POST(request: Request) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  const recipient = process.env.FORM_NOTIFICATION_EMAIL || gmailUser;

  if (!gmailUser || !gmailAppPassword || !recipient) {
    return Response.json({ error: 'Email service is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return Response.json({ ok: true });

    const subject = String(body._subject || 'New Gigatron website submission').slice(0, 160);
    const replyTo = body._replyto ? String(body._replyto).slice(0, 254) : undefined;
    const fields = Object.entries(body)
      .filter(([key, value]) => !key.startsWith('_') && key !== 'website' && value != null)
      .map(([key, value]) => [key, String(value).slice(0, 5000)] as const);

    if (!fields.length) {
      return Response.json({ error: 'No form data was supplied.' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    });

    await transporter.sendMail({
      from: `Gigatron Sports Website <${gmailUser}>`,
      to: recipient,
      replyTo,
      subject,
      text: fields.map(([key, value]) => `${key}: ${value}`).join('\n\n'),
      html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto"><h2>${escapeHtml(subject)}</h2><table style="width:100%;border-collapse:collapse">${fields.map(([key, value]) => `<tr><th style="text-align:left;vertical-align:top;padding:10px;border:1px solid #ddd;background:#f5f5f5">${escapeHtml(key)}</th><td style="padding:10px;border:1px solid #ddd;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`).join('')}</table></div>`,
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('Email delivery failed:', error);
    return Response.json({ error: 'Email delivery failed.' }, { status: 500 });
  }
}
