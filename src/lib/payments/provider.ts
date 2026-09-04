import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  VerifiedPaymentEvent,
} from "./types";

/**
 * Generic payment provider adapter.
 * Replace this with a real provider (Stripe, Lemon Squeezy, etc.).
 *
 * This stub implements the interface but requires real provider credentials
 * to function. It will throw if called without proper configuration.
 */
export class GenericPaymentProvider implements PaymentProvider {
  name = "generic";

  private apiKey: string;
  private webhookSecret: string;

  constructor() {
    this.apiKey = process.env.PAYMENT_API_KEY || "";
    this.webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || "";
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    if (!this.apiKey) {
      throw new Error("Payment provider not configured. Set PAYMENT_API_KEY.");
    }

    // TODO: Replace with real provider API call
    // Example for Stripe:
    // const session = await stripe.checkout.sessions.create({...});
    // return { checkoutUrl: session.url, providerSessionId: session.id };

    throw new Error(
      "Payment provider not yet implemented. Configure a real provider in src/lib/payments/providers/."
    );
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentEvent> {
    if (!this.webhookSecret) {
      throw new Error(
        "Payment webhook secret not configured. Set PAYMENT_WEBHOOK_SECRET."
      );
    }

    // TODO: Replace with real provider webhook verification
    // Example for Stripe:
    // const body = await request.text();
    // const sig = request.headers.get("stripe-signature");
    // const event = stripe.webhooks.constructEvent(body, sig, this.webhookSecret);

    throw new Error(
      "Payment webhook verification not yet implemented. Configure a real provider."
    );
  }
}

/**
 * Get the configured payment provider instance.
 */
export function getPaymentProvider(): PaymentProvider {
  const providerName = process.env.PAYMENT_PROVIDER || "generic";

  switch (providerName) {
    case "generic":
      return new GenericPaymentProvider();
    // Add real providers here:
    // case "stripe":
    //   return new StripePaymentProvider();
    default:
      return new GenericPaymentProvider();
  }
}
