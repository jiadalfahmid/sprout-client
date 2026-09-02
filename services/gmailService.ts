import { getAccessToken, googleSignIn } from './googleAuth';

export interface SendInviteParams {
  toEmail: string;
  recipientName: string;
  inviterName: string;
  inviterEmail?: string;
  relation: string;
  customMessage?: string;
  inviteLink?: string;
}

/**
 * Base64URL-encode string in a UTF-8 safe way for Gmail REST API
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Build RFC 2822 email with HTML content
 */
function createMimeMessage(params: SendInviteParams): string {
  const subject = `Family Invitation: Join ${params.inviterName} on Sprout Care`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const fromHeader = params.inviterEmail 
    ? `${params.inviterName} <${params.inviterEmail}>` 
    : `${params.inviterName} via Sprout`;

  const inviteUrl = params.inviteLink || (typeof window !== 'undefined' ? window.location.origin : 'https://sprout-family.app');

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin: 0 0 6px 0; }
    .subtitle { font-size: 14px; opacity: 0.9; margin: 0; }
    .body-content { padding: 32px 24px; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; border: 1px solid #a7f3d0; }
    .paragraph { font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 16px; }
    .quote-box { background-color: #f1f5f9; border-left: 4px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-style: italic; color: #475569; font-size: 14px; }
    .features-card { background-color: #fafaf9; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f0f0ee; }
    .features-title { font-weight: 700; font-size: 14px; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .feature-item { display: flex; align-items: center; margin-bottom: 8px; font-size: 14px; color: #475569; }
    .btn-container { text-align: center; margin: 32px 0 20px; }
    .btn { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3); }
    .footer { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🌱 Sprout</div>
      <p class="subtitle">Unified Home &amp; Family Care</p>
    </div>
    <div class="body-content">
      <h1 class="greeting">Hello ${params.recipientName || 'Family Member'}!</h1>
      <span class="badge">Role: ${params.relation || 'Family Member'}</span>
      
      <p class="paragraph">
        <strong>${params.inviterName}</strong> (${params.inviterEmail || 'Family Admin'}) has invited you to join their private family circle on <strong>Sprout</strong>.
      </p>

      ${params.customMessage ? `<div class="quote-box">"${params.customMessage}"</div>` : ''}

      <div class="features-card">
        <div class="features-title">What you'll get inside:</div>
        <div class="feature-item">📅 <strong>Google Calendar Sync:</strong> Synchronized appointments, visits &amp; family tasks.</div>
        <div class="feature-item">💊 <strong>Health &amp; Medicine Trackers:</strong> Timely dosage alerts &amp; refill reminders.</div>
        <div class="feature-item">💳 <strong>Family Finance:</strong> Shared expense tracking &amp; recurring bill schedules.</div>
        <div class="feature-item">📋 <strong>Task &amp; Chore Board:</strong> Coordinated home management in real time.</div>
      </div>

      <div class="btn-container">
        <a href="${inviteUrl}" class="btn" target="_blank">
          Accept Invitation &amp; Open Sprout
        </a>
      </div>

      <p class="paragraph" style="font-size: 13px; color: #64748b; text-align: center;">
        Click the button above and sign in with your account (<strong>${params.toEmail}</strong>) to automatically link with ${params.inviterName}'s family circle.
      </p>
    </div>
    <div class="footer">
      Sent with care from Sprout Unified Home &amp; Family Care.<br>
      Connected via Google Workspace Integration.
    </div>
  </div>
</body>
</html>
  `.trim();

  const lines = [
    `To: ${params.toEmail}`,
    `From: ${fromHeader}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody
  ];

  return lines.join('\r\n');
}

/**
 * Generate a mailto link with pre-filled subject and body as fallback
 */
export function createMailtoUrl(params: SendInviteParams): string {
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sprout-live.firebaseapp.com';
  const inviteUrl = params.inviteLink || appOrigin;
  const subject = `Family Invitation: Join ${params.inviterName} on Sprout Care`;
  const body = `Hi ${params.recipientName || 'there'},

${params.inviterName} has invited you to join their family care circle on Sprout.

${params.customMessage ? `"${params.customMessage}"\n\n` : ''}Click the link below to accept the invitation and link your account with ${params.inviterName}'s family circle:
${inviteUrl}

Best regards,
${params.inviterName}`;

  return `mailto:${encodeURIComponent(params.toEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Send Gmail invitation to a family member using the user's Gmail API scope.
 */
export const sendFamilyInviteViaGmail = async (params: SendInviteParams): Promise<{ success: boolean; messageId?: string; error?: string; mailtoFallback?: string }> => {
  const mailtoFallback = createMailtoUrl(params);
  try {
    let token = await getAccessToken();

    // If token is not available in memory, prompt sign in
    if (!token) {
      const authResult = await googleSignIn();
      token = authResult?.accessToken || null;
    }

    if (!token) {
      throw new Error('Authentication required: please connect your Google account to send Gmail invites.');
    }

    const rawMime = createMimeMessage(params);
    const base64UrlEmail = base64UrlEncode(rawMime);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: base64UrlEmail }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawErrorMsg = errorData.error?.message || `Gmail API error (${response.status})`;

      if (rawErrorMsg.includes('Gmail API has not been used') || rawErrorMsg.includes('disabled')) {
        return {
          success: false,
          error: 'Gmail API is propagating in your project or disabled. You can open your email client to send the invitation directly.',
          mailtoFallback,
        };
      }

      throw new Error(rawErrorMsg);
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Failed to send Gmail invite:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to send invite email',
      mailtoFallback,
    };
  }
};
