import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Platform,
  Linking,
  Image,
  StatusBar,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Crown,
  Check,
  Bell,
  ShieldCheck,
  Award,
  HelpCircle,
  Phone,
  Mail,
  MessageCircle,
  ChevronRight,
  Zap,
  Headphones,
  Ticket,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { palette } from "../../theme/colors";
import {
  getBanners,
  getSubscriptionPlans,
  getMySubscription,
  resolvePhotoUrl,
  getActivePromoBanner,
} from "../../services/api";
import { fonts } from "@/src/theme";
import { Skeleton } from "../../components/Skeleton";

const { width } = Dimensions.get("window");

export default function PremiumScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top + 80;
  const isDark = false;
  
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [promoCoupon, setPromoCoupon] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const themeBg = isDark ? "#0A0A0A" : "#FFFFFF";
  const cardBg = isDark ? "#1A1A1A" : "#FFFFFF";
  const textColor = isDark ? "#FFFFFF" : "#1A1A1A";
  const mutedText = isDark ? "#AAAAAA" : "#666666";
  const accentGold = palette.gold.main;
  const deepPurple = "#3B1E54";

  const fetchPremiumData = async () => {
    try {
      const [plansRes, bannersRes, subRes, promoRes] = await Promise.all([
        getSubscriptionPlans(),
        getBanners(),
        getMySubscription(),
        getActivePromoBanner(),
      ]);

      if (plansRes.data.success) {
        const mappedPlans = plansRes.data.plans.map((p: any) => ({
          id: p.id,
          name: p.name,
          duration:
            p.durationDays === 365 ? "1 Year" : `${p.durationDays / 30} Months`,
          price: `₹${p.price.INR || p.price.inr || 0}`,
          oldPrice: p.price.oldPrice ? `₹${p.price.oldPrice}` : null,
          discount: p.price.discount || null,
          features: Array.isArray(p.features) ? p.features : [],
          badge: p.badge || null,
          popular: !!p.badge,
          accent:
            p.name === "Diamond"
              ? "#D4AF37"
              : p.name === "Gold"
                ? "#3B1E54"
                : "#B4B4B4",
          rawPlan: p,
        }));
        setPlans(mappedPlans);
      }

      if (bannersRes.data.success) {
        setBanners(bannersRes.data.data);
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchPremiumData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPremiumData();
  };

  const handleChoosePlan = (plan: any) => {
    navigation.navigate("Checkout", { plan: plan.rawPlan || plan });
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
            <View style={[styles.activeSubCard, { backgroundColor: deepPurple }]}>
              <View style={styles.activeSubHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeSubTitle}>
                    Current Plan: {subscription.plan?.name}
                  </Text>
                  <Text style={styles.activeSubExpiry}>
                    Valid until{" "}
                    {new Date(subscription.endDate).toLocaleDateString(
                      "en-IN",
                      { day: "numeric", month: "short", year: "numeric" },
                    )}
                  </Text>
                </View>
                <Crown size={32} color={accentGold} />
              </View>

              <View style={styles.usageGrid}>
                <View style={styles.usageItem}>
                  <Text
                    style={[
                      styles.usageValue,
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
                  <Text style={styles.usageValue}>
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
                <ShieldCheck size={16} color={accentGold} />
                <Text style={styles.activeSubFooterText}>
                  Your premium features are active
                </Text>
              </View>
            </View>
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
            data={plans}
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
              onPress={() => Linking.openURL("tel:+911234567890")}
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
                  Available 24/7 for premium users
                </Text>
              </View>
              <ChevronRight size={16} color={mutedText} />
            </TouchableOpacity>

            <View style={styles.supportDivider} />

            <TouchableOpacity
              style={styles.supportRowItem}
              onPress={() => Linking.openURL("mailto:support@punarmilan.com")}
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
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  activeSubCard: {
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  activeSubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  activeSubTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    ...fonts.bold,
    letterSpacing: -0.5,
  },
  activeSubExpiry: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    marginTop: 4,
    ...fonts.semibold,
  },
  usageGrid: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  usageItem: {
    flex: 1,
    alignItems: "center",
  },
  usageValue: {
    color: "#FFFFFF",
    fontSize: 20,
    ...fonts.bold,
  },
  usageLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    ...fonts.semibold,
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  usageDivider: {
    width: 1,
    height: 35,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  activeSubFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
    paddingVertical: 8,
    borderRadius: 12,
  },
  activeSubFooterText: {
    color: "#D4AF37",
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
});
