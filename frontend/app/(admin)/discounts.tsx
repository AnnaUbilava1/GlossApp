import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Button,
  Card,
  IconButton,
  Text,
  useTheme,
  Snackbar,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import MasterPinModal from "../../src/components/MasterPinModal";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  getAllDiscounts,
  updateDiscount,
  deleteDiscount,
  type Discount,
} from "../../src/services/discountService";
import { MASTER_PIN } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;
const isDesktop = width >= 1024;

export default function DiscountsScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("discounts");
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(null);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);

  // Fetch discounts on mount
  useEffect(() => {
    if (!token) return;

    const fetchDiscounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const allDiscounts = await getAllDiscounts(token);
        setDiscounts(allDiscounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.discounts.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, [token]);

  const refreshDiscounts = async () => {
    if (!token) return;
    try {
      const allDiscounts = await getAllDiscounts(token);
      setDiscounts(allDiscounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.discounts.loadFailed"));
    }
  };

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      // Already here
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    // Physical person discounts cannot be modified
    if (discount.id.startsWith("physical-")) {
      setError(t("admin.discounts.physicalCannotModify"));
      return;
    }

    try {
      await updateDiscount(token, discount.id, { active: !discount.active });
      setSuccessMessage(discount.active ? t("admin.discounts.deactivated") : t("admin.discounts.activated"));
      await refreshDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.discounts.updateFailed"));
    }
  };

  const handleDeleteClick = (discountId: string) => {
    setDiscountToDelete(discountId);
    setMasterPinForAction("");
  };

  const handleDeleteConfirm = async (pin: string) => {
    if (!token || !discountToDelete) return;
    const trimmed = pin.trim();
    if (!trimmed || trimmed !== MASTER_PIN) {
      setError(t("admin.incorrectPin"));
      setDiscountToDelete(null);
      return;
    }
    try {
      await deleteDiscount(token, discountToDelete, trimmed);
      setSuccessMessage(t("admin.discounts.deleteSuccess"));
      setMasterPinForAction(null);
      setDiscountToDelete(null);
      await refreshDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.discounts.deleteFailed"));
      setDiscountToDelete(null);
    }
  };

  const isPhysicalPersonDiscount = (discount: Discount) => {
    return discount.id.startsWith("physical-");
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AdminHeader user={user ? { name: user.name || user.email } : { name: "Admin" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: t("admin.vehicles"), icon: "vehicles" },
              { key: "companies", label: t("admin.companies"), icon: "companies" },
              { key: "discounts", label: t("admin.discounts"), icon: "discounts" },
              { key: "washers", label: t("admin.washers"), icon: "washers" },
              { key: "types", label: t("admin.types"), icon: "types" },
              { key: "pricing", label: t("admin.pricing"), icon: "pricing" },
              { key: "appusers", label: t("admin.appUsers"), icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <View style={styles.headerRow}>
            <Text variant="titleLarge" style={styles.title}>
              {t("admin.discounts.title")}
            </Text>
          </View>

          <Text variant="bodyMedium" style={styles.subtitle}>
            {t("admin.discounts.subtitle")}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyLarge">{t("admin.discounts.loading")}</Text>
            </View>
          ) : discounts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t("admin.discounts.noDiscounts")}
              </Text>
            </View>
          ) : (
            <View style={styles.discountsList}>
              {discounts.map((discount) => {
                const isPhysical = isPhysicalPersonDiscount(discount);
                return (
                  <Card
                    key={discount.id}
                    style={[
                      styles.discountCard,
                      !discount.active && styles.discountCardInactive,
                    ]}
                    contentStyle={styles.discountCardContent}
                  >
                    <View style={styles.discountCardHeader}>
                      <View style={styles.discountInfo}>
                        <View style={styles.discountNameRow}>
                          <Text variant="titleMedium" style={styles.discountName}>
                            {discount.companyName} {discount.percentage}%
                          </Text>
                          {!discount.active && (
                            <Chip mode="outlined" compact style={styles.inactiveChip}>
                              {t("admin.discounts.inactive")}
                            </Chip>
                          )}
                          {isPhysical && (
                            <Chip mode="outlined" compact style={styles.systemChip}>
                              {t("admin.discounts.system")}
                            </Chip>
                          )}
                        </View>
                        {!isPhysical && discount.companyId && (
                          <Text variant="bodySmall" style={styles.companyId}>
                            {t("admin.discounts.companyId")}: {discount.companyId}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.discountPercentage}>
                        {discount.percentage}%
                      </Text>
                    </View>
                    {!isPhysical && (
                      <View style={styles.discountActions}>
                        <Button
                          mode={discount.active ? "outlined" : "contained"}
                          icon={discount.active ? "pause" : "play"}
                          onPress={() => handleToggleActive(discount)}
                          style={styles.toggleButton}
                          compact
                        >
                          {discount.active ? t("admin.discounts.deactivate") : t("admin.discounts.activate")}
                        </Button>
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#D32F2F"
                          onPress={() => handleDeleteClick(discount.id)}
                        />
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <MasterPinModal
        visible={discountToDelete !== null}
        onDismiss={() => {
          setDiscountToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setDiscountToDelete(null);
          handleDeleteConfirm(pin);
        }}
        title={t("admin.discounts.deleteTitle")}
        description={t("admin.discounts.deleteDescription")}
      />

      <Snackbar
        visible={!!error}
        onDismiss={() => setError(null)}
        duration={4000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(null)}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: theme.colors.primaryContainer }]}
      >
        {successMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isMobile ? 12 : isTablet ? 20 : 24,
  },
  card: {
    borderRadius: 12,
    padding: isMobile ? 16 : isTablet ? 24 : 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isMobile ? 16 : 24,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  subtitle: {
    color: "#757575",
    marginBottom: 24,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#757575",
  },
  discountsList: {
    gap: 12,
  },
  discountCard: {
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  discountCardInactive: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  discountCardContent: {
    padding: isMobile ? 12 : 16,
  },
  discountCardHeader: {
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    marginBottom: 12,
    gap: isMobile ? 8 : 0,
  },
  discountInfo: {
    flex: 1,
  },
  discountNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
    flexWrap: "wrap",
  },
  discountName: {
    fontWeight: "600",
  },
  inactiveChip: {
    height: 24,
  },
  systemChip: {
    height: 24,
    backgroundColor: "#E3F2FD",
  },
  companyId: {
    color: "#757575",
    fontSize: 12,
  },
  discountPercentage: {
    fontSize: isMobile ? 20 : 24,
    fontWeight: "bold",
    color: "#2F80ED",
    alignSelf: isMobile ? "flex-start" : "auto",
  },
  discountActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: isMobile ? "flex-start" : "flex-end",
    gap: 8,
    flexWrap: "wrap",
    marginTop: isMobile ? 8 : 0,
  },
  toggleButton: {
    marginRight: 4,
  },
  snackbar: {
    marginBottom: 16,
  },
});

