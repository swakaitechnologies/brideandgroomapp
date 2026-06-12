import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Linking,
  Image,
  ImageBackground,
  StatusBar,
  View,
  Text,
  RefreshControl,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Crown,
  Check,
  ShieldCheck,
  Award,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Headphones,
  Ticket,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palette } from "../../theme/colors";
import {
  getSubscriptionPlans,
  getMySubscription,
  getActivePromoBanner,
} from "../../services/api";
import { fonts } from "@/src/theme";
import { Skeleton } from "../../components/Skeleton";

const { width } = Dimensions.get("window");
const TIER_ORDER = ["Silver", "Gold", "Diamond", "Platinum"];
const TIER_COLORS: Record<string, string> = {
  Silver: "#B4B4B4",
  Gold: "#3B1E54",
  Diamond: "#D4AF37",
  Platinum: "#5A3280",
};

const ACTIVE_PLAN_WATERCOLORS: Record<string, any> = {
  Silver: require("../../../assets/images/watercolor_silver_opt.png"),
  Gold: require("../../../assets/images/watercolor_gold_opt.png"),
  Diamond: require("../../../assets/images/watercolor_diamond_opt.png"),
  Platinum: require("../../../assets/images/watercolor_platinum_opt.png"),
};

const ACTIVE_PLAN_HEADER_TEXT_COLORS: Record<string, string> = {
  Silver: "#1C3F44",
  Gold: "#FFFFFF",
  Diamond: "#4E3600",
  Platinum: "#FFFFFF",
};

const ACTIVE_PLAN_ACCENTS: Record<string, string> = {
  Silver: "#3a707a",
  Gold: "#8A2387",
  Diamond: "#D4AF37",
  Platinum: "#5A3280",
};

const PREMIUM_FAQS = [
  {
    question: "What are the key benefits of upgrading to Premium?",
    answer: "Premium plans allow you to reveal contact details (phone and email) of match profiles, watch match video introductions, display VIP badges, and increase your overall profile visibility by up to 3x."
  },
  {
    question: "How long is my subscription valid?",
    answer: "Depending on your selected tier, subscriptions are valid for 90 Days (3 Months), 180 Days (6 Months), or 365 Days (1 Year)."
  },
  {
    question: "What is the 100% Money-Back Guarantee?",
    answer: "If you upgrade to premium and do not receive any match interests or response messages within 30 days, we will issue a full refund. Terms and conditions apply."
  },
  {
    question: "Can I upgrade my active plan later?",
    answer: "Yes, you can upgrade to a higher tier plan at any time. The billing adjustments are computed pro-rata based on the remaining days of your current plan."
  },
  {
    question: "Are payment transactions secure?",
    answer: "Absolutely. All transactions are securely processed and fully encrypted via industry-standard protocols, supporting UPI, credit/debit cards, net banking, and wallets."
  }
];


export default function PremiumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 80;
  const isDark = false;

  // Theme Colors
  const themeBg = isDark ? "#0A0514" : "#F8F5FC";
  const cardBg = isDark ? "#120B1E" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#3B1E54";
  const mutedText = isDark ? "rgba(255, 255, 255, 0.6)" : "#7A6F8B";
  const deepPurple = "#3B1E54";
  const accentGold = "#D4AF37";

  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [promoCoupon, setPromoCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>("Gold");
  const [showActivePlanModal, setShowActivePlanModal] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<any>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const activePlanName = subscription?.plan?.name || "Gold";
  const activeAccentColor = ACTIVE_PLAN_ACCENTS[activePlanName] || ACTIVE_PLAN_ACCENTS.Gold;
  const activeHeaderTextColor = ACTIVE_PLAN_HEADER_TEXT_COLORS[activePlanName] || ACTIVE_PLAN_HEADER_TEXT_COLORS.Gold;

  const fetchPremiumData = useCallback(async () => {
    try {
      const [plansRes, subRes, promoRes] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription(),
        getActivePromoBanner(),
      ]);

      if (plansRes.data.success) {
        const mappedPlans = plansRes.data.plans.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          durationDays: p.durationDays,
          duration:
            p.durationDays === 365 ? "1 Year"
              : p.durationDays === 180 ? "6 Months"
                : p.durationDays === 90 ? "3 Months"
                  : `${p.durationDays} Days`,
          price: `₹${p.price.INR || p.price.inr || 0}`,
          priceValue: p.price.INR || p.price.inr || 0,
          oldPrice: p.price.oldPrice ? `₹${p.price.oldPrice}` : null,
          discount: p.price.discount || null,
          features: Array.isArray(p.displayFeatures) && p.displayFeatures.length > 0
            ? p.displayFeatures
            : Array.isArray(p.features) ? p.features : [],
          badge: p.badge || null,
          popular: !!p.badge,
          freeTrialDays: p.freeTrialDays || 0,
          accent: TIER_COLORS[p.name] || "#B4B4B4",
          rawPlan: p,
        }));
        setPlans(mappedPlans);

        // Auto-select the first available tier
        if (mappedPlans.length > 0) {
          const availableTiers = [...new Set(mappedPlans.map((p: any) => p.name))] as string[];
          const preferred = TIER_ORDER.find(t => availableTiers.includes(t));
          if (preferred) setSelectedTier(preferred);
        }
      }

      if (subRes.data.success) {
        setSubscription(subRes.data.subscription);
      }

      if (promoRes && promoRes.data?.success && promoRes.data?.coupon) {
        setPromoCoupon(promoRes.data.coupon);
      } else {
        setPromoCoupon(null);
      }
    } catch (error) {
      console.error("Fetch Premium Data Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPremiumData();
    }, [fetchPremiumData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPremiumData();
  };

  const handleChoosePlan = (plan: any) => {
    // If user has an active plan, show the confirmation modal
    if (subscription) {
      setPendingPlan(plan);
      setShowActivePlanModal(true);
    } else {
      navigation.navigate("Checkout", { plan: plan.rawPlan || plan });
    }
  };

  const handleProceedAnyway = () => {
    setShowActivePlanModal(false);
    if (pendingPlan) {
      navigation.navigate("Checkout", {
        plan: pendingPlan.rawPlan || pendingPlan,
        proceedAnyway: true,
      });
      setPendingPlan(null);
    }
  };

  const handleCancelPurchase = () => {
    setShowActivePlanModal(false);
    setPendingPlan(null);
  };

  const handlePromoApply = async () => {
    if (promoCoupon?.code) {
      await AsyncStorage.setItem("preAppliedCoupon", promoCoupon.code);
      Alert.alert(
        "Coupon Applied!",
        `Coupon code "${promoCoupon.code}" has been applied. Choose a plan below to complete purchase with discount.`,
        [{ text: "OK" }]
      );
    }
  };

  const renderPlanCard = ({ item }: { item: any }) => (
    <View
      style={[
        styles.planCard,
        { borderColor: item.accent, backgroundColor: cardBg },
      ]}
    >
      {item.badge && (
        <View style={[styles.popularBadge, { backgroundColor: item.accent }]}>
          <Text style={styles.popularText}>{item.badge.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: item.accent }]}>
          {item.name}
        </Text>
        <Text style={[styles.cardDuration, { color: mutedText }]}>
          {item.duration}
        </Text>
      </View>
      <View style={styles.priceContainer}>
        <Text style={[styles.priceTag, { color: textColor }]}>
          {item.price}
        </Text>
        <View style={styles.discountRow}>
          {item.oldPrice && (
            <Text style={[styles.oldPriceTag, { color: mutedText }]}>
              {item.oldPrice}
            </Text>
          )}
          {item.discount && (
            <Text style={styles.discountLabel}>{item.discount}</Text>
          )}
        </View>
      </View>
      <View style={styles.featureList}>
        {(item.features || []).map((f: string, i: number) => (
          <View key={i} style={styles.featureItem}>
            <Check size={16} color={item.accent} />
            <Text style={[styles.featureText, { color: textColor }]}>{f}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[styles.cardButton, { backgroundColor: item.accent }]}
        onPress={() => handleChoosePlan(item)}
      >
        <Text style={styles.cardButtonText}>Choose Plan</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: themeBg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPadding }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            progressViewOffset={topPadding}
          />
        }
      >
        {/* Active Subscription Dashboard */}
        {subscription && (
          <View style={styles.activeSubContainer}>
            <ImageBackground
              source={ACTIVE_PLAN_WATERCOLORS[activePlanName] || ACTIVE_PLAN_WATERCOLORS.Gold}
              style={styles.activeSubCard}
              resizeMethod="resize"
              imageStyle={{
                resizeMode: "stretch",
                left: -12,
                top: -12,
                right: -12,
                bottom: -12,
              }}
            >
              <View style={styles.activeSubHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activeSubTitle, { color: activeHeaderTextColor }]}>
                    Current Plan: {activePlanName}
                  </Text>
                  <Text style={[styles.activeSubExpiry, { color: activeHeaderTextColor === "#FFFFFF" ? "rgba(255, 255, 255, 0.8)" : "rgba(28, 63, 68, 0.8)" }]}>
                    Valid until{" "}
                    {new Date(subscription.endDate).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </Text>
                </View>
                <Crown size={32} color={activeHeaderTextColor} />
              </View>

              <View style={styles.usageGrid}>
                <View style={styles.usageItem}>
                  <Text
                    style={[
                      styles.usageValue,
                      { color: activeAccentColor },
                      subscription.plan?.maxContacts === -1 && { fontSize: 15 },
                    ]}
                  >
                    {subscription.plan?.maxContacts === -1
                      ? "Unlimited"
                      : subscription.plan?.maxContacts -
                      subscription.contactsUsed}
                  </Text>
                  <Text style={styles.usageLabel}>
                    Contacts
                  </Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageItem}>
                  <Text
                    style={[
                      styles.usageValue,
                      { color: activeAccentColor },
                      subscription.plan?.maxMessages === -1 && { fontSize: 15 },
                    ]}
                  >
                    {subscription.plan?.maxMessages === -1
                      ? "Unlimited"
                      : subscription.plan?.maxMessages -
                      subscription.messagesUsed}
                  </Text>
                  <Text style={styles.usageLabel}>Messages</Text>
                </View>
                <View style={styles.usageDivider} />
                <View style={styles.usageItem}>
                  <Text style={[styles.usageValue, { color: activeAccentColor }]}>
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(subscription.endDate).getTime() -
                          new Date().getTime()) /
                        (1000 * 60 * 60 * 24),
                      ),
                    )}
                  </Text>
                  <Text style={styles.usageLabel}>Days Left</Text>
                </View>
              </View>

              <View style={styles.activeSubFooter}>
                <ShieldCheck size={16} color={activeAccentColor} />
                <Text style={[styles.activeSubFooterText, { color: activeAccentColor }]}>
                  Your premium features are active
                </Text>
              </View>
            </ImageBackground>
          </View>
        )}


        {/* Section: Promotions (Just like SideDrawer) */}
        {promoCoupon && (
          <View style={styles.couponSection}>
            <View
              style={[
                styles.couponCard,
                {
                  backgroundColor: isDark ? "#1E1E1E" : "#F9F7FF",
                  borderColor: isDark ? palette.gold.main : palette.purple.border,
                },
              ]}
            >
              <Ticket size={24} color={palette.gold.main} />
              <View style={styles.couponInfo}>
                <Text style={[styles.couponTitle, { color: textColor }]}>
                  {promoCoupon.description}
                </Text>
                <Text style={[styles.couponSubtitle, { color: mutedText }]}>
                  Use code: {promoCoupon.code}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.applyBtn}
                onPress={handlePromoApply}
              >
                <Text style={styles.applyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tier Tabs */}
        {!loading && (
          <View style={styles.tierTabs}>
            {TIER_ORDER.filter(tier => plans.some(p => p.name === tier)).map(tier => (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierTab,
                  selectedTier === tier && {
                    backgroundColor: TIER_COLORS[tier],
                    borderColor: TIER_COLORS[tier],
                  },
                ]}
                onPress={() => setSelectedTier(tier)}
              >
                <Text
                  style={[
                    styles.tierTabText,
                    selectedTier === tier && styles.tierTabTextActive,
                  ]}
                >
                  {tier}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Carousel */}
        {loading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 15 }}
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.planCard,
                  {
                    borderColor: isDark ? "#2C2C2E" : "#E5E5EA",
                    backgroundColor: cardBg,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Skeleton width={120} height={22} style={{ marginBottom: 8 }} />
                  <Skeleton width={80} height={12} />
                </View>
                <View style={styles.priceContainer}>
                  <Skeleton width={140} height={40} style={{ marginBottom: 8 }} />
                  <View style={styles.discountRow}>
                    <Skeleton width={60} height={14} />
                  </View>
                </View>
                <View style={styles.featureList}>
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <View key={idx} style={styles.featureItem}>
                      <Skeleton width={16} height={16} borderRadius={8} />
                      <Skeleton width={150} height={12} />
                    </View>
                  ))}
                </View>
                <Skeleton width="100%" height={48} borderRadius={12} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <FlatList
            data={plans.filter(p => p.name === selectedTier)}
            renderItem={renderPlanCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, paddingTop: 15 }}
            snapToInterval={width * 0.75 + 20}
            decelerationRate="fast"
          />
        )}

        {/* Trust Points */}
        <View style={styles.trustGrid}>
          <View style={styles.trustItem}>
            <ShieldCheck size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>
              Safe & Secure
            </Text>
          </View>
          <View style={styles.trustItem}>
            <Award size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>
              Verified Profiles
            </Text>
          </View>
          <View style={styles.trustItem}>
            <MessageCircle size={24} color={deepPurple} />
            <Text style={[styles.trustLabel, { color: textColor }]}>
              24/7 Support
            </Text>
          </View>
        </View>

        {/* Money Back Guarantee Section */}
        <View style={styles.moneyBackSection}>
          <Image
            source={require("../../../assets/images/money-back.png")}
            style={styles.moneyBackImage}
            resizeMode="contain"
          />
          <View style={styles.moneyBackContent}>
            <Text style={[styles.moneyBackTitle, { color: textColor }]}>
              100% Money Back Guarantee
            </Text>
            <Text style={[styles.moneyBackSubtitle, { color: mutedText }]}>
              Find your perfect match or get a 100% refund. No questions asked.{" "}
              <Text
                style={styles.termsLink}
                onPress={() => navigation.navigate("RefundPolicy")}
              >
                Terms and conditions apply.
              </Text>
            </Text>
          </View>
        </View>

        {/* Collapsible FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <HelpCircle size={22} color={deepPurple} />
            <Text style={[styles.faqSectionTitle, { color: textColor }]}>
              Frequently Asked Questions
            </Text>
          </View>
          <View style={styles.faqList}>
            {PREMIUM_FAQS.map((faq, index) => {
              const isExpanded = expandedFaqIndex === index;
              return (
                <View key={index} style={[styles.faqCard, { backgroundColor: cardBg }]}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setExpandedFaqIndex(isExpanded ? null : index)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestionText, { color: textColor }]}>
                      {faq.question}
                    </Text>
                    {isExpanded ? (
                      <ChevronUp size={16} color={deepPurple} />
                    ) : (
                      <ChevronDown size={16} color={deepPurple} />
                    )}
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={styles.faqAnswerContainer}>
                      <Text style={[styles.faqAnswerText, { color: mutedText }]}>
                        {faq.answer}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Redesigned Support Center */}
        <View style={styles.supportCenter}>
          <View style={styles.supportHeader}>
            <Headphones size={24} color={deepPurple} />
            <View style={styles.supportHeaderText}>
              <Text style={[styles.supportTitle, { color: textColor }]}>
                Need Assistance?
              </Text>
              <Text style={[styles.supportSubtitle, { color: mutedText }]}>
                Our experts are here to help you find your match.
              </Text>
            </View>
          </View>

          <View style={styles.supportCardContainer}>
            <TouchableOpacity
              style={styles.supportRowItem}
              onPress={() => Linking.openURL("tel:+918698891975")}
            >
              <View
                style={[
                  styles.supportIconBg,
                  { backgroundColor: "rgba(59, 30, 84, 0.1)" },
                ]}
              >
                <Phone size={18} color={deepPurple} />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>
                  Call Support
                </Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>
                  Available Mon-Sat, 9:00 AM to 6:00 PM IST.
                </Text>
              </View>
              <ChevronRight size={16} color={mutedText} />
            </TouchableOpacity>

            <View style={styles.supportDivider} />

            <TouchableOpacity
              style={styles.supportRowItem}
              onPress={() => Linking.openURL("mailto:support@brideandgroom.co.in")}
            >
              <View
                style={[
                  styles.supportIconBg,
                  { backgroundColor: "rgba(212, 175, 55, 0.1)" },
                ]}
              >
                <Mail size={18} color={accentGold} />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>
                  Email Us
                </Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>
                  Response time: Less than 24 hours
                </Text>
              </View>
              <ChevronRight size={16} color={mutedText} />
            </TouchableOpacity>

            <View style={styles.supportDivider} />

            <TouchableOpacity
              style={styles.supportRowItem}
              onPress={() => navigation.navigate("HelpSupport", { activeTab: "faqs" })}
            >
              <View
                style={[
                  styles.supportIconBg,
                  { backgroundColor: "rgba(76, 175, 80, 0.1)" },
                ]}
              >
                <HelpCircle size={18} color="#4CAF50" />
              </View>
              <View style={styles.supportOptionText}>
                <Text style={[styles.supportOptionLabel, { color: textColor }]}>
                  Browse FAQs
                </Text>
                <Text style={[styles.supportOptionSub, { color: mutedText }]}>
                  Common questions & quick answers
                </Text>
              </View>
              <ChevronRight size={16} color={mutedText} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Active Plan Warning Modal */}
      <Modal
        visible={showActivePlanModal}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={handleCancelPurchase}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.activePlanModal}>
            <Crown size={36} color={accentGold} />
            <Text style={styles.modalTitle}>Active Plan Detected</Text>
            <Text style={styles.modalMessage}>
              You already have an active <Text style={{ fontWeight: "800" }}>{subscription?.plan?.name}</Text> plan valid until{" "}
              <Text style={{ fontWeight: "800" }}>
                {subscription?.endDate
                  ? new Date(subscription.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                  : "N/A"}
              </Text>.
              {"\n\n"}Purchasing a new plan will replace your current subscription.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={handleCancelPurchase}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalProceedBtn}
                onPress={handleProceedAnyway}
              >
                <Text style={styles.modalProceedText}>Proceed Anyway</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  appHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    ...fonts.semibold,
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 100,
  },
  activeSubContainer: {
    paddingHorizontal: 24,
    marginBottom: 25,
  },
  activeSubCard: {
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EDE6F5",
    overflow: "hidden",
    aspectRatio: 1.85,
    justifyContent: "space-between",
  },
  activeSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  activeSubTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  activeSubExpiry: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    marginTop: 4,
    ...fonts.semibold,
  },
  usageGrid: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  usageItem: {
    flex: 1,
    alignItems: "center",
  },
  usageValue: {
    fontSize: 22,
    ...fonts.bold,
  },
  usageLabel: {
    color: "#7A6F8B",
    fontSize: 11,
    ...fonts.semibold,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  usageDivider: {
    width: 1,
    height: 35,
    backgroundColor: "rgba(59, 30, 84, 0.08)",
  },
  activeSubFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  activeSubFooterText: {
    fontSize: 13,
    ...fonts.bold,
  },
  couponSection: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 25,
  },
  couponCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 30, 84, 0.05)",
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#D4AF37",
    borderStyle: "dashed",
  },
  couponInfo: {
    flex: 1,
    marginLeft: 12,
  },
  couponTitle: {
    fontSize: 14,
    ...fonts.semibold,
    color: "#3B1E54",
  },
  couponSubtitle: {
    fontSize: 11,
    color: "#7E6B8F",
  },
  applyBtn: {
    backgroundColor: "#D4AF37",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  applyBtnText: {
    fontSize: 11,
    ...fonts.semibold,
    color: "#3B1E54",
  },
  planCard: {
    width: width * 0.75,
    borderWidth: 1,
    borderRadius: 20,
    padding: 25,
    marginRight: 20,
    overflow: "visible",
  },
  popularBadge: {
    position: "absolute",
    top: -12,
    right: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 10,
  },
  popularText: {
    color: "#FFF",
    fontSize: 10,
    ...fonts.bold,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    ...fonts.bold,
    textTransform: "uppercase",
  },
  cardDuration: {
    fontSize: 12,
    ...fonts.semibold,
    marginTop: 2,
  },
  priceContainer: {
    marginBottom: 25,
  },
  priceTag: {
    fontSize: 36,
    ...fonts.bold,
  },
  discountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -2,
  },
  oldPriceTag: {
    fontSize: 16,
    textDecorationLine: "line-through",
    opacity: 0.6,
  },
  discountLabel: {
    fontSize: 12,
    ...fonts.bold,
    color: "#2E7D32",
  },
  featureList: {
    gap: 12,
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    ...fonts.semibold,
  },
  cardButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cardButtonText: {
    color: "#FFF",
    fontSize: 15,
    ...fonts.bold,
  },
  trustGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 40,
    paddingHorizontal: 20,
  },
  trustItem: {
    alignItems: "center",
    gap: 8,
  },
  trustLabel: {
    fontSize: 11,
    ...fonts.semibold,
    opacity: 0.7,
  },
  supportCenter: {
    paddingHorizontal: 20,
    marginBottom: 40,
    marginTop: 10,
  },
  supportHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginBottom: 25,
  },
  supportHeaderText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 20,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  supportSubtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  supportCardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.06)",
    overflow: "hidden",
  },
  supportRowItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 15,
  },
  supportDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(59, 30, 84, 0.06)",
    marginLeft: 75,
  },
  supportIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  supportOptionText: {
    flex: 1,
  },
  supportOptionLabel: {
    fontSize: 15,
    ...fonts.bold,
  },
  supportOptionSub: {
    fontSize: 11,
    marginTop: 2,
    ...fonts.semibold,
  },
  moneyBackSection: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 20,
    backgroundColor: "rgba(59, 30, 84, 0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.05)",
    gap: 15,
  },
  moneyBackImage: {
    width: 60,
    height: 60,
  },
  moneyBackContent: {
    flex: 1,
  },
  moneyBackTitle: {
    fontSize: 15,
    ...fonts.bold,
    letterSpacing: -0.2,
  },
  moneyBackSubtitle: {
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  termsLink: {
    color: "#D4AF37",
    textDecorationLine: "underline",
    ...fonts.semibold,
  },
  tierTabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  tierTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tierTabText: {
    fontSize: 13,
    color: "#7A6F8B",
    ...fonts.semibold,
  },
  tierTabTextActive: {
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  activePlanModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    shadowColor: "#3B1E54",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    ...fonts.bold,
    color: "#3B1E54",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 13,
    color: "#7A6F8B",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#EDE6F5",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  modalCancelText: {
    fontSize: 14,
    ...fonts.bold,
    color: "#7A6F8B",
  },
  modalProceedBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#3B1E54",
    alignItems: "center",
  },
  modalProceedText: {
    fontSize: 14,
    ...fonts.bold,
    color: "#FFFFFF",
  },
  faqSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 10,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  faqSectionTitle: {
    fontSize: 18,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  faqList: {
    gap: 10,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59, 30, 84, 0.06)",
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#3B1E54",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  faqQuestionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  faqQuestionText: {
    fontSize: 13,
    ...fonts.semibold,
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(59, 30, 84, 0.04)",
    paddingTop: 10,
  },
  faqAnswerText: {
    fontSize: 12,
    lineHeight: 18,
    ...fonts.regular,
  },
});
