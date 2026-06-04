export async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!apiUrl || !token || !phoneNumberId) {
    // Mock mode — log to console
    console.log(`[WhatsApp MOCK] To: ${phone}`);
    console.log(`[WhatsApp MOCK] Message: ${message}`);
    return true;
  }

  // Real Meta Cloud API call
  try {
    const res = await fetch(`${apiUrl}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.replace(/\D/g, ''), // digits only
        type: 'text',
        text: { body: message },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[WhatsApp] Send error:', err);
    return false;
  }
}
