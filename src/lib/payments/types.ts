export interface CheckoutInput {
  productId: string;
  productName: string;
  price: number; // major units
  amountMinor: number; // minor units (cents)
  currency: string;
  customerId?: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  attemptId: string; // internal checkout_attempt id for idempotency
  isPhysical?: boolean;
}

export interface CheckoutResult {
  checkoutUrl: string;
  providerSessionId: string;
}

export interface VerifiedPaymentEvent {
  type: "payment.completed" | "payment.failed" | "refund.completed" | "order.cancelled";
  providerOrderId: string;
  productId: string;
  amount: number;
  currency: string;
  customerEmail?: string;
  customerId?: string;
  rawPayload: Record<string, unknown>;
}

export interface PaymentProvider {
  name: string;
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
  verifyWebhook(request: Request): Promise<VerifiedPaymentEvent>;
}
