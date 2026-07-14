// WhatsApp/SMS delivery behind a single provider interface.
//
// To plug in a real provider (Twilio, Meta WhatsApp Business API, a local
// Iraqi SMS gateway, …): implement WhatsAppProvider and return it from
// getWhatsAppProvider() based on WHATSAPP_PROVIDER. Nothing else in the app
// needs to change.

export interface WhatsAppProvider {
  /** Sends a plain-text WhatsApp message to a normalized +964… number. */
  send(to: string, message: string): Promise<void>;
}

/** Dev/default provider: logs the message to the server terminal. */
class ConsoleWhatsAppProvider implements WhatsAppProvider {
  async send(to: string, message: string): Promise<void> {
    console.log(`\n[MOCK WHATSAPP → ${to}]\n${message}\n`);
  }
}

// Example of what a real integration slots into:
//
// class TwilioWhatsAppProvider implements WhatsAppProvider {
//   async send(to: string, message: string) {
//     await twilioClient.messages.create({
//       from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
//       to: `whatsapp:${to}`,
//       body: message,
//     });
//   }
// }

export function getWhatsAppProvider(): WhatsAppProvider {
  switch (process.env.WHATSAPP_PROVIDER) {
    // case "twilio": return new TwilioWhatsAppProvider();
    default:
      return new ConsoleWhatsAppProvider();
  }
}

/** Sends a checkout verification code. */
export async function sendWhatsAppOtp(to: string, code: string): Promise<void> {
  await getWhatsAppProvider().send(
    to,
    `Bazary.iq: your order verification code is ${code}. It expires in 5 minutes.`
  );
}
