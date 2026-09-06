import "server-only";
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  VerifiedPaymentEvent,
} from "./types";

/**
 * Generic payment provider adapter (fallback for tests without Stripe keys).
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
    throw new Error(
      "Generic provider not implemented. Set PAYMENT_PROVIDER=stripe and configure STRIPE_SECRET_KEY."
    );
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentEvent> {
    if (!this.webhookSecret) {
      throw new Error(
        "Payment webhook secret not configured. Set PAYMENT_WEBHOOK_SECRET."
      );
    }
    throw new Error(
      "Generic webhook verification not implemented. Configure STRIPE_WEBHOOK_SECRET."
    );
  }
}

export class StripePaymentProvider implements PaymentProvider {
  name = "stripe";
  private stripe: InstanceType<typeof import("stripe").default> | null = null;
  private webhookSecret: string;

  constructor() {
    const key = process.env.STRIPE_SECRET_KEY || process.env.PAYMENT_API_KEY || "";
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET || "";
    if (key) {
      // Dynamically import stripe to avoid bundling issues
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Stripe = require("stripe").default;
      this.stripe = new Stripe(key, { apiVersion: "2024-06-20" });
    }
  }

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    if (!this.stripe) {
      throw new Error("Stripe not configured. Set STRIPE_SECRET_KEY.");
    }
    // Stripe expects amount in minor units
    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: input.currency.toLowerCase(),
            product_data: { name: input.productName },
            unit_amount: input.amountMinor,
          },
          quantity: 1,
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.customerEmail,
      metadata: {
        productId: input.productId,
        userId: input.customerId || "",
        attemptId: input.attemptId,
      },
      // For physical, we could add shipping, but keep single product for now
    });

    if (!session.url || !session.id) {
      throw new Error("Failed to create Stripe session");
    }
    return { checkoutUrl: session.url, providerSessionId: session.id };
  }

  async verifyWebhook(request: Request): Promise<VerifiedPaymentEvent> {
    if (!this.stripe || !this.webhookSecret) {
      throw new Error("Stripe webhook not configured. Set STRIPE_WEBHOOK_SECRET.");
    }
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
      throw new Error("Missing stripe-signature");
    }
    // Must use raw body, not json
    const rawBody = await request.text();
    let event: import("stripe").Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid signature";
      // Distinguish signature error (400) by throwing with specific message
      throw new Error(`Invalid signature: ${msg}`);
    }

    // Map Stripe event to our VerifiedPaymentEvent
    // Stripe checkout.session.completed -> payment.completed
    // payment_intent.payment_failed -> payment.failed
    // charge.refunded -> refund.completed
    // checkout.session.expired / payment_intent.canceled -> order.cancelled
    const obj = event.data.object as unknown as Record<string, unknown>;
    const metadata = (obj.metadata as Record<string, string>) || {};

    // Common fields
    const providerOrderId =
      (obj.id as string) || (metadata.attemptId as string) || event.id;
    const productId = (metadata.productId as string) || (obj.product as string) || "";
    const customerId = (metadata.userId as string) || undefined;
    const customerEmail = (obj.customer_email as string) || (obj.customer_details as { email?: string })?.email || undefined;

    // Amount and currency: for checkout.session, amount_total and currency
    let amount = 0;
    let currency = "USD";
    if (typeof obj.amount_total === "number") {
      amount = obj.amount_total;
      currency = (obj.currency as string)?.toUpperCase() || "USD";
    } else if (typeof obj.amount === "number") {
      amount = obj.amount;
      currency = (obj.currency as string)?.toUpperCase() || "USD";
    }

    let type: VerifiedPaymentEvent["type"] = "payment.completed";
    switch (event.type) {
      case "checkout.session.completed":
        if ((obj.payment_status as string) === "paid") type = "payment.completed";
        else type = "payment.completed";
        break;
      case "payment_intent.succeeded":
        type = "payment.completed";
        break;
      case "payment_intent.payment_failed":
        type = "payment.failed";
        break;
      case "charge.refunded":
        type = "refund.completed";
        break;
      case "checkout.session.expired":
      case "payment_intent.canceled":
        type = "order.cancelled";
        break;
      default:
        // For unhandled, treat as payment.completed if paid, else failed
        if (event.type.includes("refunded")) type = "refund.completed";
        else if (event.type.includes("failed")) type = "payment.failed";
        else if (event.type.includes("cancel")) type = "order.cancelled";
        else type = "payment.completed";
    }

    return {
      type,
      providerOrderId: providerOrderId as string,
      productId: productId as string,
      amount,
      currency,
      customerEmail,
      customerId,
      rawPayload: { id: event.id, type: event.type, object: obj, stripeEventId: event.id } as Record<string, unknown>,
    };
  }
}

/**
 * Get the configured payment provider instance.
 */
export function getPaymentProvider(): PaymentProvider {
  const providerName = (process.env.PAYMENT_PROVIDER || "generic").toLowerCase();

  switch (providerName) {
    case "stripe":
      return new StripePaymentProvider();
    case "generic":
      return new GenericPaymentProvider();
    default:
      // Fallback to stripe if keys present, else generic
      if (process.env.STRIPE_SECRET_KEY) return new StripePaymentProvider();
      return new GenericPaymentProvider();
  }
}
