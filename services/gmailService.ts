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
 * Escape special HTML characters to prevent HTML/content injection attacks
 */
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips carriage returns and newlines to prevent email header (CRLF) injection
 */
function sanitizeHeader(input: string): string {
  return input.replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Build RFC 2822 email with HTML content
 */
function createMimeMessage(params: SendInviteParams): string {
  const safeHeaderInviterName = sanitizeHeader(params.inviterName || 'Family Organizer');
  const safeHeaderInviterEmail = params.inviterEmail ? sanitizeHeader(params.inviterEmail) : '';
  const safeHeaderToEmail = sanitizeHeader(params.toEmail || '');

  const subject = `Family Invitation: Join ${safeHeaderInviterName} on Sprout Care`;
  const encodedSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const fromHeader = safeHeaderInviterEmail 
    ? `${safeHeaderInviterName} <${safeHeaderInviterEmail}>` 
    : `${safeHeaderInviterName} via Sprout`;

  const inviteUrl = params.inviteLink || (typeof window !== 'undefined' ? window.location.origin : 'https://sprout-family.app');

  const safeRecipientName = escapeHtml(params.recipientName || 'Family Member');
  const safeRelation = escapeHtml(params.relation || 'Family Member');
  const safeInviterName = escapeHtml(params.inviterName || 'Family Organizer');
  const safeInviterEmail = params.inviterEmail ? escapeHtml(params.inviterEmail) : '';
  const safeCustomMessage = params.customMessage ? escapeHtml(params.customMessage) : '';
  const safeInviteUrl = escapeHtml(inviteUrl);

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Family Invitation</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #0f172a; -webkit-font-smoothing: antialiased; }
    .email-wrapper { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0; }
    .header-bar { background-color: #0f172a; padding: 28px 24px; text-align: center; color: #ffffff; border-bottom: 3px solid #10b981; }
    .brand-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin: 0; color: #ffffff; display: inline-flex; align-items: center; gap: 8px; }
    .brand-subtitle { font-size: 13px; color: #94a3b8; margin: 4px 0 0 0; font-weight: 500; }
    .body-section { padding: 32px 28px; }
    .greeting { font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
    .role-badge { display: inline-block; background-color: #ecfdf5; color: #059669; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 6px; margin-bottom: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.5px; }
    .paragraph { font-size: 15px; line-height: 1.65; color: #334155; margin: 0 0 16px 0; }
    .quote-box { background-color: #f8fafc; border-left: 3px solid #10b981; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 20px 0; font-style: italic; color: #475569; font-size: 14px; line-height: 1.5; }
    
    .features-grid { background-color: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #e2e8f0; }
    .features-header { font-weight: 700; font-size: 12px; color: #64748b; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.75px; }
    
    .feature-row { display: table; width: 100%; margin-bottom: 12px; }
    .feature-row:last-child { margin-bottom: 0; }
    .feature-icon-cell { display: table-cell; width: 36px; vertical-align: middle; }
    .feature-text-cell { display: table-cell; vertical-align: middle; font-size: 14px; color: #334155; line-height: 1.4; }
    
    .icon-box { width: 28px; height: 28px; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; text-align: center; line-height: 28px; }
    .icon-emerald { background-color: #ecfdf5; }
    .icon-blue { background-color: #eff6ff; }
    .icon-amber { background-color: #fffbeb; }
    .icon-purple { background-color: #faf5ff; }

    .btn-wrap { text-align: center; margin: 32px 0 24px; }
    .btn-action { display: inline-block; background-color: #10b981; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
    
    .link-box { font-size: 12px; color: #64748b; text-align: center; margin-top: 16px; padding: 12px; background-color: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
    .link-url { color: #059669; word-break: break-all; font-weight: 600; text-decoration: underline; }
    
    .footer-section { background-color: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header-bar">
      <div class="brand-title">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; display: inline-block;">
          <path d="M12 22v-9"></path>
          <path d="M9 7a3 3 0 0 1 6 0c0 3-3 6-3 6s-3-3-3-6Z"></path>
          <path d="M12 13c-4.5 0-7 2.5-7 7"></path>
          <path d="M12 13c4.5 0 7 2.5 7 7"></path>
        </svg>
        <span style="vertical-align: middle;">Sprout Care</span>
      </div>
      <p class="brand-subtitle">Unified Home &amp; Family Care Platform</p>
    </div>

    <div class="body-section">
      <h1 class="greeting">Hello ${safeRecipientName},</h1>
      <span class="role-badge">Role: ${safeRelation}</span>
      
      <p class="paragraph">
        <strong>${safeInviterName}</strong> (${safeInviterEmail || 'Family Organizer'}) has invited you to join their private family circle on <strong>Sprout Care</strong>.
      </p>

      ${safeCustomMessage ? `<div class="quote-box">"${safeCustomMessage}"</div>` : ''}

      <div class="features-grid">
        <div class="features-header">Shared Family Care Features</div>
        
        <div class="feature-row">
          <div class="feature-icon-cell">
            <div class="icon-box icon-emerald">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
              </svg>
            </div>
          </div>
          <div class="feature-text-cell">
            <strong>Medication &amp; Health Tracking:</strong> Daily dosage schedules, adherence alerts, and refill tracking.
          </div>
        </div>

        <div class="feature-row">
          <div class="feature-icon-cell">
            <div class="icon-box icon-blue">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
          </div>
          <div class="feature-text-cell">
            <strong>Calendar &amp; Medical Appointments:</strong> Doctor visits and family schedules synchronized with Google Calendar.
          </div>
        </div>

        <div class="feature-row">
          <div class="feature-icon-cell">
            <div class="icon-box icon-amber">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
              </svg>
            </div>
          </div>
          <div class="feature-text-cell">
            <strong>Tasks &amp; Care Coordination:</strong> Shared household chores, grocery lists, and care assignments.
          </div>
        </div>

        <div class="feature-row">
          <div class="feature-icon-cell">
            <div class="icon-box icon-purple">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
            </div>
          </div>
          <div class="feature-text-cell">
            <strong>Medical Profiles &amp; Contacts:</strong> Allergies, emergency contacts, and vital medical history safely synced.
          </div>
        </div>
      </div>

      <div class="btn-wrap">
        <a href="${safeInviteUrl}" class="btn-action" target="_blank">
          Accept Invitation &amp; Join Circle
        </a>
      </div>

      <div class="link-box">
        If the button does not work, copy and paste this link into your browser:<br>
        <a href="${safeInviteUrl}" class="link-url" target="_blank">${safeInviteUrl}</a>
      </div>
    </div>

    <div class="footer-section">
      Sent with care from Sprout Unified Home &amp; Family Care.<br>
      Access is securely restricted to authorized family members.
    </div>
  </div>
</body>
</html>
  `.trim();

  const lines = [
    `To: ${safeHeaderToEmail}`,
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
  const appOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://sprout-family.app';
  const inviteUrl = params.inviteLink || appOrigin;
  const subject = `Family Invitation: Join ${params.inviterName} on Sprout Care`;
  const body = `Hi ${params.recipientName || 'there'},

${params.inviterName} has invited you to join their family care circle on Sprout.

Role: ${params.relation || 'Family Member'}
${params.customMessage ? `\nPersonal Note: "${params.customMessage}"\n` : ''}
Click the link below to accept the invitation and link your account with ${params.inviterName}'s family circle:
${inviteUrl}

Features included:
- Medication & Health Tracking (doses, schedules, refill alerts)
- Calendar & Medical Appointments (doctor visits, Google Calendar sync)
- Tasks & Care Coordination (household chores, grocery lists)
- Medical Profiles & Emergency Contacts

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
