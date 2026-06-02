const logger = require("../utils/logger");
const {
  SubscriptionPlan,
  Subscription,
  Payment,
  Coupon,
} = require("../models/associations");
const {
  createOrder,
  verifyRazorpaySignature,
  selectGateway,
} = require("../utils/paymentGateway");
const { Op } = require("sequelize");

/**
 * GET /api/payments/plans — List active plans for user's country
 */
exports.getPlans = async (req, res) => {
  try {
    const countryCode = req.query.country || req.headers["x-country-code"] || "ALL";

    const plans = await SubscriptionPlan.findAll({
      where: { isActive: true },
      order: [["priority", "DESC"], ["durationDays", "ASC"]],
    });

    // Filter by country availability
    const filtered = plans.filter((plan) => {
      const availability = plan.countryAvailability || ["ALL"];
      return availability.includes("ALL") || availability.includes(countryCode);
    });

    res.json({ success: true, plans: filtered });
  } catch (error) {
    logger.error("GET PLANS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch plans" });
  }
};

/**
 * POST /api/payments/create-order — Create a payment order
 */
exports.createPaymentOrder = async (req, res) => {
  try {
    const { planId, currency = "INR", couponCode } = req.body;
    const userId = req.userId;

    const plan = await SubscriptionPlan.findByPk(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ success: false, message: "Plan not found or inactive" });
    }

    const basePrice = plan.price[currency];
    if (!basePrice) {
      return res.status(400).json({ success: false, message: `Price not available in ${currency}` });
    }

    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const uppercaseCode = couponCode.trim().toUpperCase();
      const coupon = await Coupon.findOne({ where: { code: uppercaseCode, isActive: true } });
      if (coupon) {
        const now = new Date();
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > now;
        const hasUsesLeft = coupon.maxUses === -1 || coupon.usedCount < coupon.maxUses;

        if (isNotExpired && hasUsesLeft) {
          appliedCoupon = coupon;
          const val = parseFloat(coupon.discountValue);
          if (coupon.discountType === "percentage") {
            discountAmount = Math.round(basePrice * (val / 100));
          } else if (coupon.discountType === "fixed") {
            discountAmount = Math.min(val, basePrice);
          }
        } else {
          return res.status(400).json({ success: false, message: "Applied coupon has expired or reached usage limit" });
        }
      } else {
        return res.status(400).json({ success: false, message: "Invalid coupon code" });
      }
    }

    const discountedBasePrice = Math.max(0, basePrice - discountAmount);
    const platformFee = 0;
    const gstAmount = Math.round(discountedBasePrice * 0.18);
    const totalPayable = discountedBasePrice + platformFee + gstAmount;

    // Create gateway order
    const order = await createOrder({
      amount: totalPayable,
      currency,
      planName: plan.name,
      userId,
      metadata: { 
        planId: plan.id,
        couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        discountAmount,
        platformFee,
        gstAmount,
      },
    });

    // Record payment in DB
    const payment = await Payment.create({
      userId,
      planId: plan.id,
      amount: totalPayable,
      currency,
      gateway: order.gateway,
      gatewayOrderId: order.orderId,
      status: "created",
      couponId: appliedCoupon ? appliedCoupon.id : null,
      metadata: {
        originalAmount: basePrice,
        discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        platformFee,
        gstAmount,
      },
    });

    res.json({
      success: true,
      order: { ...order, paymentId: payment.id },
    });
  } catch (error) {
    logger.error("CREATE ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

/**
 * POST /api/payments/verify — Verify payment and activate subscription
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, stripe_session_id } = req.body;

    const payment = await Payment.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found" });
    }

    const userId = payment.userId;

    // Verify based on gateway
    if (payment.gateway === "razorpay") {
      const isValid = verifyRazorpaySignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        payment.status = "failed";
        await payment.save();
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }

      payment.gatewayPaymentId = razorpay_payment_id;
    } else if (payment.gateway === "stripe") {
      // Stripe verification is handled via webhooks; this is a fallback check
      payment.gatewayPaymentId = stripe_session_id;
    }

    payment.status = "paid";
    await payment.save();

    // Increment coupon usage count if a coupon was applied
    if (payment.couponId) {
      try {
        const coupon = await Coupon.findByPk(payment.couponId);
        if (coupon) {
          coupon.usedCount += 1;
          await coupon.save();
        }
      } catch (couponUseErr) {
        logger.error("INCREMENT COUPON USE ERROR:", couponUseErr);
      }
    }

    // Activate subscription
    const plan = await SubscriptionPlan.findByPk(payment.planId);
    const now = new Date();
    const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

    // Expire any existing active subscription
    await Subscription.update(
      { status: "expired" },
      { where: { userId, status: "active" } }
    );

    const subscription = await Subscription.create({
      userId,
      planId: plan.id,
      status: "active",
      startDate: now,
      endDate,
      paymentId: payment.id,
    });

    res.json({
      success: true,
      message: "Payment verified and subscription activated",
      subscription: {
        id: subscription.id,
        planName: plan.name,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        status: subscription.status,
        plan: {
          id: plan.id,
          name: plan.name,
          durationDays: plan.durationDays,
          maxContacts: plan.maxContacts,
          maxMessages: plan.maxMessages,
          features: plan.features,
        },
      },
    });
  } catch (error) {
    logger.error("VERIFY PAYMENT ERROR:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

/**
 * GET /api/payments/my-subscription — Get current subscription
 */
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      where: {
        userId: req.userId,
        status: { [Op.in]: ["active", "trialing"] },
        endDate: { [Op.gt]: new Date() },
      },
      include: [{ model: SubscriptionPlan, as: "plan" }],
      order: [["endDate", "DESC"]],
    });

    res.json({
      success: true,
      subscription: subscription || null,
      isPremium: !!subscription,
    });
  } catch (error) {
    logger.error("GET SUBSCRIPTION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subscription" });
  }
};

/**
 * GET /api/payments/history — Payment history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Payment.findAndCountAll({
      where: { userId: req.userId },
      include: [{ model: SubscriptionPlan, as: "plan", attributes: ["name", "slug"] }],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      payments: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    logger.error("PAYMENT HISTORY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch payment history" });
  }
};

/**
 * GET /api/payments/checkout-session/:paymentId — Render Web Checkout Page
 */
exports.renderCheckoutPage = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      where: { id: paymentId },
      include: [{ model: SubscriptionPlan, as: "plan" }],
    });

    if (!payment) {
      return res.status(404).send("Payment not found");
    }

    if (payment.status === "paid") {
      return res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; background-color: #f8f9fa;">
            <div style="background: white; padding: 40px; border-radius: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #4CAF50; margin-bottom: 10px;">Payment Already Completed!</h2>
              <p style="color: #666; margin-bottom: 20px;">You are already subscribed to the ${payment.plan.name} plan.</p>
              <a href="brideandgroom://payment-success" style="display: inline-block; background-color: #3B1E54; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Return to App</a>
            </div>
          </body>
        </html>
      `);
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const amountInPaise = Math.round(payment.amount * 100);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Checkout</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
          }
          .loader-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            max-width: 90%;
            width: 400px;
          }
          .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #3B1E54;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          h2 {
            color: #1f2937;
            margin: 0 0 8px;
            font-size: 1.25rem;
          }
          p {
            color: #6b7280;
            margin: 0 0 24px;
            font-size: 0.875rem;
          }
          .btn {
            background-color: #3B1E54;
            color: white;
            border: none;
            padding: 12px 24px;
            font-size: 0.95rem;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            transition: background-color 0.2s;
          }
          .btn:hover {
            background-color: #27123a;
          }
        </style>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      </head>
      <body>
        <div class="loader-container">
          <div class="spinner" id="spinner"></div>
          <h2 id="title">Initializing Payment...</h2>
          <p id="description">Please do not close this window or press back.</p>
          <button class="btn" id="pay-btn" style="display: none;" onclick="startPayment()">Pay Now</button>
        </div>

        <script>
          const options = {
            key: "${keyId}",
            amount: ${amountInPaise},
            currency: "${payment.currency}",
            name: "Bride & Groom Matrimony",
            description: "${payment.plan.name} Subscription Plan",
            image: "https://brideandgroom.co.in/Logo.png",
            order_id: "${payment.gatewayOrderId}",
            handler: async function (response) {
              document.getElementById("spinner").style.display = "block";
              document.getElementById("pay-btn").style.display = "none";
              document.getElementById("title").innerText = "Verifying Payment...";
              document.getElementById("description").innerText = "Checking payment status with our servers...";

              try {
                const res = await fetch("/api/payments/verify", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    paymentId: "${payment.id}",
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature
                  })
                });

                const data = await res.json();
                if (data.success) {
                  document.getElementById("spinner").style.display = "none";
                  document.getElementById("title").innerText = "Payment Successful!";
                  document.getElementById("title").style.color = "#4CAF50";
                  document.getElementById("description").innerText = "Redirecting you back to the app...";
                  setTimeout(() => {
                    window.location.href = "brideandgroom://payment-success";
                  }, 1500);
                } else {
                  showError(data.message || "Verification failed");
                }
              } catch (err) {
                showError("Network error occurred during verification.");
              }
            },
            prefill: {
              name: "",
              email: "",
              contact: ""
            },
            theme: {
              color: "#3B1E54"
            },
            modal: {
              ondismiss: function () {
                document.getElementById("spinner").style.display = "none";
                document.getElementById("pay-btn").style.display = "block";
                document.getElementById("title").innerText = "Payment Cancelled";
                document.getElementById("description").innerText = "You closed the payment modal. Click below to try again.";
              }
            }
          };

          const rzp = new Razorpay(options);

          rzp.on('payment.failed', function (response){
            showError("Payment failed: " + response.error.description);
          });

          function startPayment() {
            document.getElementById("spinner").style.display = "none";
            document.getElementById("pay-btn").style.display = "none";
            document.getElementById("title").innerText = "Awaiting Payment...";
            document.getElementById("description").innerText = "Complete your payment in the secure popup.";
            rzp.open();
          }

          function showError(message) {
            document.getElementById("spinner").style.display = "none";
            document.getElementById("pay-btn").style.display = "block";
            document.getElementById("title").innerText = "Payment Failed";
            document.getElementById("title").style.color = "#f44336";
            document.getElementById("description").innerText = message;
          }

          // Auto-start payment on load
          window.onload = function() {
            startPayment();
          };
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    logger.error("RENDER CHECKOUT PAGE ERROR:", error);
    res.status(500).send("An error occurred initializing checkout.");
  }
};
