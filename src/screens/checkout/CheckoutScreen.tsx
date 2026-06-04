import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  ChevronLeft, 
  ShieldCheck, 
  CreditCard, 
  ArrowRight,
  Percent,
  Info,
  Tag,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import { palette } from '../../theme/colors';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RazorpayCheckout from 'react-native-razorpay';
import { createPaymentOrder, verifyPayment, validateCoupon } from '../../services/api';
import { fonts } from "@/src/theme";

const { width } = Dimensions.get('window');

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  
  // Reading plan data
  const plan = route.params?.plan || {
    id: '1',
    name: 'Gold',
    durationDays: 90,
    price: { INR: 2499 },
    features: ['Contact 15 Members', 'Unlimited Interests', 'Priority Support'],
  };

  const isDark = false;
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activatedPlan, setActivatedPlan] = useState<string>('');

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const accentColor = palette.purple.deep;
  const goldColor = palette.gold.main;
  const textColor = isDark ? '#FFFFFF' : '#1A1A1A';
  const mutedText = isDark ? '#A0A0A0' : '#666666';
  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDark ? '#333333' : '#EEEEEE';

  const basePrice = plan.price?.INR || plan.price?.inr || 0;
  const platformFee = 0;
  const discountedBasePrice = basePrice - discountAmount;
  const gstAmount = Math.max(0, Math.round(discountedBasePrice * 0.18));
  const totalAmount = Math.max(0, discountedBasePrice + platformFee + gstAmount);

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) {
      Alert.alert("Error", "Please enter a coupon code");
      return;
    }

    setIsValidating(true);
    try {
      const res = await validateCoupon(code, plan.id, 'INR');
      if (res.data?.success) {
        setAppliedCoupon(res.data.coupon);
        setDiscountAmount(res.data.discountAmount);
        setCouponCode(res.data.coupon.code);
        Alert.alert("Success", res.data?.message || "Coupon applied successfully!");
      } else {
        Alert.alert("Error", res.data?.message || "Invalid coupon code");
        setAppliedCoupon(null);
        setDiscountAmount(0);
      }
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.message || "Failed to validate coupon");
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    setCouponCode('');
  };

  useEffect(() => {
    const checkPreAppliedCoupon = async () => {
      try {
        const code = await AsyncStorage.getItem('preAppliedCoupon');
        if (code) {
          await AsyncStorage.removeItem('preAppliedCoupon');
          setCouponCode(code);
          await handleApplyCoupon(code);
        }
      } catch (e) {
        console.log("Error reading pre-applied coupon:", e);
      }
    };
    checkPreAppliedCoupon();
  }, []);

  const handlePay = async () => {
    setLoading(true);
    try {
      // Step 1: Create payment order on backend
      const res = await createPaymentOrder(
        plan.id, 
        'INR', 
        appliedCoupon ? appliedCoupon.code : undefined
      );

      if (!res.data?.success) {
        Alert.alert("Error", res.data?.message || "Failed to initiate payment.");
        setLoading(false);
        return;
      }

      const orderData = res.data.order;
      const internalPaymentId = orderData.paymentId;
      const amountInPaise = Math.round(orderData.amount * 100);

      // Step 2: Open native Razorpay checkout modal
      const options = {
        description: `${plan.name} Subscription Plan`,
        image: 'https://brideandgroom.co.in/Logo.png',
        currency: orderData.currency || 'INR',
        key: orderData.key,
        amount: amountInPaise.toString(),
        name: 'Bride & Groom Matrimony',
        order_id: orderData.orderId,
        prefill: {
          email: '',
          contact: '',
          name: '',
        },
        theme: { color: '#3B1E54' },
      };

      const razorpayResponse = await RazorpayCheckout.open(options);

      // Step 3: Verify payment on backend (from mobile app — has X-Mobile-App header)
      const verifyRes = await verifyPayment({
        paymentId: internalPaymentId,
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      if (verifyRes.data?.success) {
        // Step 4: Payment verified — show success
        const planName = verifyRes.data.subscription?.planName || plan.name;
        setActivatedPlan(planName);
        setSuccess(true);

        setTimeout(() => {
          Alert.alert(
            "Payment Successful! 🎉",
            `You are now subscribed to the ${planName} Plan. Enjoy premium features!`,
            [
              {
                text: "Go to Home",
                onPress: () => navigation.reset({
                  index: 0,
                  routes: [{ name: 'Tabs' }],
                }),
              },
            ]
          );
        }, 800);
      } else {
        Alert.alert(
          "Verification Failed",
          verifyRes.data?.message || "Payment was received but verification failed. Please contact support.",
        );
      }
    } catch (err: any) {
      // Razorpay modal dismissed or payment failed
      if (err?.code === 'PAYMENT_CANCELLED' || err?.description?.includes('cancelled')) {
        // User dismissed the modal — do nothing
        console.log("Payment cancelled by user");
      } else if (err?.code === 2) {
        // User pressed back / dismissed modal
        console.log("Payment modal dismissed");
      } else {
        const errorMsg = err?.description || err?.message || "Payment could not be completed. Please try again.";
        Alert.alert("Payment Failed", errorMsg);
        console.error("Payment error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#000' : '#F8F9FA' }]}>
      {/* Header */}
      <View style={[
        styles.header, 
        { 
          backgroundColor: cardBg,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      {success ? (
        <View style={[styles.successContainer, { paddingTop: 20 }]}>
          <LottieView
            source={require('../../../assets/animations/7ae221e8-1183-11ee-a1e0-f351111eea7f.json')}
            autoPlay
            loop={false}
            style={{ width: 160, height: 160, marginBottom: 20 }}
          />
          <Text style={[styles.successTitle, { color: textColor }]}>Payment Confirmed!</Text>
          <Text style={[styles.successSub, { color: mutedText }]}>
            Your profile has been upgraded to <Text style={{ ...fonts.bold, color: accentColor }}>{activatedPlan || plan.name}</Text>.
          </Text>
          <Text style={[styles.successHint, { color: mutedText }]}>
            Premium features are now active on your account.
          </Text>
          <TouchableOpacity
            style={styles.goHomeBtn}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] })}
          >
            <LinearGradient
              colors={[accentColor, '#7B1FA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goHomeBtnGradient}
            >
              <Text style={styles.goHomeBtnText}>Go to Home</Text>
              <ArrowRight size={18} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
        >
          {/* Order Summary */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Order Summary</Text>
            
            <View style={styles.planDetailsRow}>
              <View>
                <Text style={[styles.planName, { color: textColor }]}>{plan.name} Plan</Text>
                <Text style={[styles.planDuration, { color: mutedText }]}>Duration: {plan.durationDays} Days</Text>
              </View>
              <Text style={[styles.planPrice, { color: textColor }]}>₹{basePrice}</Text>
            </View>

            {plan.price?.discount ? (
              <View style={styles.discountBadge}>
                <Percent size={14} color="#2E7D32" />
                <Text style={styles.discountText}>Applied: {plan.price.discount}</Text>
              </View>
            ) : null}
          </View>

          {/* Promo Coupon Section */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Promo / Coupon Code</Text>
            
            {appliedCoupon ? (
              <View style={styles.appliedCouponContainer}>
                <View style={styles.appliedCouponLeft}>
                  <Tag size={18} color="#2E7D32" />
                  <View style={styles.appliedCouponTexts}>
                    <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                    <Text style={styles.appliedCouponDesc}>{appliedCoupon.description} (Saved ₹{discountAmount})</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon} style={styles.removeCouponBtn}>
                  <Text style={styles.removeCouponText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoInputRow}>
                <TextInput
                  style={[styles.promoInput, { borderColor: borderColor, color: textColor }]}
                  placeholder="Enter Coupon Code"
                  placeholderTextColor={mutedText}
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity 
                  style={[styles.promoApplyBtn, { backgroundColor: accentColor }]}
                  onPress={() => handleApplyCoupon()}
                  disabled={isValidating}
                >
                  {isValidating ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.promoApplyBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Price Breakdown */}
          <View style={[styles.card, { backgroundColor: cardBg }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Bill Details</Text>
            
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: mutedText }]}>Plan Charges</Text>
              <Text style={[styles.priceVal, { color: textColor }]}>₹{basePrice}</Text>
            </View>

            {discountAmount > 0 && (
              <View style={styles.priceRow}>
                <Text style={[styles.priceLabel, { color: '#2E7D32' }]}>Coupon Discount</Text>
                <Text style={[styles.priceVal, { color: '#2E7D32' }]}>-₹{discountAmount}</Text>
              </View>
            )}

            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, { color: mutedText }]}>GST (18%)</Text>
              <Text style={[styles.priceVal, { color: textColor }]}>₹{gstAmount}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: borderColor }]} />

            <View style={styles.priceRow}>
              <Text style={[styles.totalLabel, { color: textColor }]}>Total Payable</Text>
              <Text style={[styles.totalVal, { color: accentColor }]}>₹{totalAmount}</Text>
            </View>
          </View>

          {/* Secure Payment Note */}
          <View style={styles.secureCard}>
            <ShieldCheck size={20} color="#2E7D32" />
            <Text style={styles.secureText}>
              100% Safe and Secure Checkout powered by Razorpay.
            </Text>
          </View>

          {/* Pay Button */}
          <TouchableOpacity 
            style={[styles.payButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handlePay}
            disabled={loading}
          >
            <LinearGradient
              colors={[accentColor, '#7B1FA2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <CreditCard size={20} color="#FFF" />
                  <Text style={styles.payButtonText}>Pay ₹{totalAmount}</Text>
                  <ArrowRight size={20} color="#FFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Info Details */}
          <View style={styles.infoBox}>
            <Info size={14} color="#555" />
            <Text style={styles.infoText}>
              By proceeding with payment, you agree to our Terms of Use and Refund Policy.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    ...fonts.semibold,
  },
  backButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 15,
    ...fonts.semibold,
    marginBottom: 16,
  },
  planDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    ...fonts.bold,
  },
  planDuration: {
    fontSize: 12,
    marginTop: 4,
  },
  planPrice: {
    fontSize: 20,
    ...fonts.bold,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  discountText: {
    color: '#2E7D32',
    fontSize: 11,
    ...fonts.semibold,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceVal: {
    fontSize: 14,
    ...fonts.semibold,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 15,
    ...fonts.bold,
  },
  totalVal: {
    fontSize: 18,
    ...fonts.bold,
  },
  secureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#E8F5E9',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  secureText: {
    fontSize: 12,
    color: '#2E7D32',
    ...fonts.semibold,
    flex: 1,
  },
  payButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  payButtonText: {
    color: '#FFF',
    fontSize: 16,
    ...fonts.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 11,
    color: '#888',
    flex: 1,
    lineHeight: 16,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  successIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    ...fonts.bold,
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  successHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  goHomeBtn: {
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 32,
    width: '80%',
  },
  goHomeBtnGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  goHomeBtnText: {
    color: '#FFF',
    fontSize: 15,
    ...fonts.semibold,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  promoInput: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 14,
    ...fonts.semibold,
  },
  promoApplyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyBtnText: {
    color: '#D4AF37',
    fontSize: 14,
    ...fonts.bold,
    letterSpacing: 0.5,
  },
  appliedCouponContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  appliedCouponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedCouponTexts: {
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 14,
    ...fonts.bold,
    color: '#2E7D32',
  },
  appliedCouponDesc: {
    fontSize: 11,
    color: '#2E7D32',
    marginTop: 2,
  },
  removeCouponBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeCouponText: {
    color: '#C62828',
    fontSize: 12,
    ...fonts.semibold,
  },
});
