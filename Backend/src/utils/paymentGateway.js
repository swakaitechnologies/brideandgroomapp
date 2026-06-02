/**
 * Payment Gateway Abstraction Layer
 * Supports Razorpay (India) and Stripe (International)
 */
const logger = require("./logger");

let Razorpay, stripe;

// Lazy-load SDKs (installed on-demand)
const getRazorpay = () => {
  if (!Razorpay) {
    try {
      Razorpay = require("razorpay");
    } catch {
      logger.warn("Razorpay SDK not installed. Run: npm install razorpay");
      return null;
    }
  }
  if (process.env.RAZORPAY_KEY_ID?.includes("YOUR_KEY_HERE")) {
    logger.warn("⚠️ Razorpay is using placeholder keys. Please update .env for real trial payments.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getStripe = () => {
  if (!stripe) {
    try {
      const Stripe = require("stripe");
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    } catch {
      logger.warn("Stripe SDK not installed. Run: npm install stripe");
      return null;
    }
  }
  return stripe;
};

/**
 * Determine which gateway to use based on currency/country.
 */
const selectGateway = (currency) => {
  return currency === "INR" ? "razorpay" : "stripe";
};

/**
 * Create a payment order/session.
 */
const createOrder = async ({ amount, currency, planName, userId, metadata = {} }) => {
  const gateway = selectGateway(currency);

  if (gateway === "razorpay") {
    const rzp = getRazorpay();
    if (!rzp) throw new Error("Razorpay is not configured");

    const order = await rzp.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency,
      receipt: `rc_${userId.substring(0, 8)}_${Date.now()}`,
      notes: { userId, planName, ...metadata },
    });

    return {
      gateway: "razorpay",
      orderId: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    };
  }

  // Stripe
  const stripeClient = getStripe();
  if (!stripeClient) throw new Error("Stripe is not configured");

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: { name: planName },
          unit_amount: Math.round(amount * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: { userId, planName, ...metadata },
    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/plans`,
  });

  return {
    gateway: "stripe",
    orderId: session.id,
    url: session.url,
    amount,
    currency,
  };
};

/**
 * Verify Razorpay payment signature.
 */
const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  // DEVELOPER BYPASS: If keys are placeholders and it's a simulated ID, allow it
  if (process.env.RAZORPAY_KEY_ID?.includes("YOUR_KEY_HERE") && paymentId.startsWith("pay_simulated")) {
    logger.warn("🛠️ [DEV] Bypassing Razorpay signature verification for simulated payment.");
    return true;
  }

  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expectedSignature === signature;
};

/**
 * Verify Stripe webhook event.
 */
const verifyStripeWebhook = (rawBody, signature) => {
  const stripeClient = getStripe();
  if (!stripeClient) throw new Error("Stripe is not configured");
  return stripeClient.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

/**
 * Issue a refund.
 */
const issueRefund = async ({ gateway, gatewayPaymentId, amount }) => {
  if (gateway === "razorpay") {
    const rzp = getRazorpay();
    if (!rzp) throw new Error("Razorpay is not configured");
    const refund = await rzp.payments.refund(gatewayPaymentId, {
      amount: amount ? Math.round(amount * 100) : undefined, // null = full refund
    });
    return { refundId: refund.id, status: refund.status };
  }

  const stripeClient = getStripe();
  if (!stripeClient) throw new Error("Stripe is not configured");
  const refund = await stripeClient.refunds.create({
    payment_intent: gatewayPaymentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
  return { refundId: refund.id, status: refund.status };
};

module.exports = {
  selectGateway,
  createOrder,
  verifyRazorpaySignature,
  verifyStripeWebhook,
  issueRefund,
};
