import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    DataTable,
    Text,
    TextInput,
    useTheme,
    Snackbar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { getPricingMatrix, updatePricingMatrix, type PricingMatrix } from "../../src/services/pricingService";
import {
  type TypeConfig,
  getCarTypeConfigs,
  getWashTypeConfigs,
} from "../../src/services/typeConfigService";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

function buildEmptyMatrix(carCodes: string[], washCodes: string[]): PricingMatrix {
  const m: PricingMatrix = {};
  carCodes.forEach((c) => {
    m[c] = {};
    washCodes.forEach((w) => {
      m[c][w] = 0;
    });
  });
  return m;
}

export default function PricingScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("pricing");
  const [carTypeConfigs, setCarTypeConfigs] = useState<TypeConfig[]>([]);
  const [washTypeConfigs, setWashTypeConfigs] = useState<TypeConfig[]>([]);
  const [pricing, setPricing] = useState<PricingMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const carTypeCodes = useMemo(
    () =>
      carTypeConfigs
        .filter((c) => c.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => c.code),
    [carTypeConfigs]
  );
  const washTypeCodes = useMemo(
    () =>
      washTypeConfigs
        .filter((w) => w.isActive && w.code !== "CUSTOM")
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((w) => w.code),
    [washTypeConfigs]
  );

  const getCarLabel = (code: string) =>
    carTypeConfigs.find((c) => c.code === code)
      ? language === "en"
        ? carTypeConfigs.find((c) => c.code === code)!.displayNameEn
        : carTypeConfigs.find((c) => c.code === code)!.displayNameKa
      : code;
  const getWashLabel = (code: string) =>
    washTypeConfigs.find((w) => w.code === code)
      ? language === "en"
        ? washTypeConfigs.find((w) => w.code === code)!.displayNameEn
        : washTypeConfigs.find((w) => w.code === code)!.displayNameKa
      : code;

  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cars, washes, matrix] = await Promise.all([
          getCarTypeConfigs(token),
          getWashTypeConfigs(token),
          getPricingMatrix(token),
        ]);
        setCarTypeConfigs(cars);
        setWashTypeConfigs(washes);
        const carCodes = cars.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder).map((c) => c.code);
        const washCodes = washes.filter((w) => w.isActive && w.code !== "CUSTOM").sort((a, b) => a.sortOrder - b.sortOrder).map((w) => w.code);
        const empty = buildEmptyMatrix(carCodes, washCodes);
        const merged: PricingMatrix = {};
        carCodes.forEach((carCode) => {
          merged[carCode] = {};
          washCodes.forEach((washCode) => {
            merged[carCode][washCode] = matrix[carCode]?.[washCode] ?? empty[carCode]?.[washCode] ?? 0;
          });
        });
        setPricing(merged);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.pricing.saveFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token]);

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "pricing") {
      // Already here
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handlePriceChange = (carType: string, serviceType: string, value: string) => {
    // Allow empty string for user input, but store as 0
    const trimmedValue = value.trim();
    if (trimmedValue === "" || trimmedValue === "-") {
      setPricing({
        ...pricing,
        [carType]: {
          ...pricing[carType],
          [serviceType]: 0,
        },
      });
      return;
    }

    const numValue = parseFloat(trimmedValue);
    // Only update if it's a valid number, and clamp to >= 0
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(0, numValue);
      setPricing({
        ...pricing,
        [carType]: {
          ...pricing[carType],
          [serviceType]: clampedValue,
        },
      });
    }
  };

  const validatePricing = (): string | null => {
    for (const carCode of carTypeCodes) {
      for (const washCode of washTypeCodes) {
        const price = pricing[carCode]?.[washCode];
        if (price === undefined || price === null) {
          return `Price is required for ${getCarLabel(carCode)} × ${getWashLabel(washCode)}`;
        }
        if (typeof price !== "number" || price < 0 || !Number.isFinite(price)) {
          return `Price must be a non-negative number for ${getCarLabel(carCode)} × ${getWashLabel(washCode)}`;
        }
      }
    }
    return null;
  };

  const handleSave = async () => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    const validationError = validatePricing();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      console.log("Saving pricing matrix:", pricing);
      await updatePricingMatrix(token, pricing);
      console.log("Pricing matrix saved successfully");
      setSuccessMessage(t("admin.pricing.saveSuccess"));
      const matrix = await getPricingMatrix(token);
      const merged: PricingMatrix = {};
      carTypeCodes.forEach((carCode) => {
        merged[carCode] = {};
        washTypeCodes.forEach((washCode) => {
          merged[carCode][washCode] = matrix[carCode]?.[washCode] ?? 0;
        });
      });
      setPricing(merged);
    } catch (err) {
      console.error("Error saving pricing:", err);
      const errorMessage = err instanceof Error ? err.message : t("admin.pricing.saveFailed");
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
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
              {t("admin.pricing.pageTitle")}
            </Text>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
              loading={saving}
              disabled={saving || loading}
            >
              {t("admin.pricing.saveAll")}
            </Button>
          </View>

          <Text variant="bodyMedium" style={styles.subtitle}>
            {t("admin.pricing.setPricesSubtitle")}
          </Text>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyLarge">{t("admin.pricing.loading")}</Text>
            </View>
          ) : (
            <>
              {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>Car Type</DataTable.Title>
                {washTypeCodes.map((washCode) => (
                  <DataTable.Title key={washCode} style={styles.priceHeaderCell}>
                    {getWashLabel(washCode)}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {carTypeCodes.map((carCode) => (
                <DataTable.Row key={carCode} style={styles.tableRow}>
                  <DataTable.Cell style={styles.carTypeCell}>
                    <Text style={styles.carTypeText}>{getCarLabel(carCode)}</Text>
                  </DataTable.Cell>
                  {washTypeCodes.map((washCode) => (
                    <DataTable.Cell key={washCode} style={styles.priceCell}>
                      <TextInput
                        mode="outlined"
                        value={pricing[carCode]?.[washCode]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carCode, washCode, value)}
                        keyboardType="numeric"
                        style={styles.priceInput}
                        contentStyle={styles.priceInputContent}
                      />
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {carTypeCodes.map((carCode) => (
                <View key={carCode} style={styles.mobileCard}>
                  <Text variant="titleMedium" style={styles.mobileCarType}>
                    {getCarLabel(carCode)}
                  </Text>
                  {washTypeCodes.map((washCode) => (
                    <View key={washCode} style={styles.mobilePriceRow}>
                      <Text variant="bodyMedium" style={styles.mobileServiceLabel}>
                        {getWashLabel(washCode)}:
                      </Text>
                      <TextInput
                        mode="outlined"
                        value={pricing[carCode]?.[washCode]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carCode, washCode, value)}
                        keyboardType="numeric"
                        style={styles.mobilePriceInput}
                        contentStyle={styles.mobilePriceInputContent}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
            </>
          )}
        </View>
      </ScrollView>

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
    padding: isTablet ? 24 : 16,
  },
  card: {
    borderRadius: 12,
    padding: isTablet ? 32 : 24,
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
    marginBottom: 8,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  subtitle: {
    color: "#757575",
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: "#2F80ED",
  },
  saveButtonLabel: {
    color: "#FFFFFF",
  },
  table: {
    backgroundColor: "transparent",
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1.5,
  },
  priceHeaderCell: {
    flex: 1,
  },
  carTypeCell: {
    flex: 1.5,
  },
  carTypeText: {
    fontWeight: "600",
  },
  priceCell: {
    flex: 1,
  },
  priceInput: {
    height: 40,
    backgroundColor: "#FAFAFA",
  },
  priceInputContent: {
    paddingVertical: 0,
    fontSize: 14,
  },
  mobileContainer: {
    gap: 16,
  },
  mobileCard: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 12,
  },
  mobileCarType: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  mobilePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  mobileServiceLabel: {
    flex: 1,
    color: "#424242",
  },
  mobilePriceInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#FFFFFF",
  },
  mobilePriceInputContent: {
    paddingVertical: 0,
  },
  loadingContainer: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  snackbar: {
    marginBottom: 16,
  },
});

