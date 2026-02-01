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
    DataTable,
    Text,
    TextInput,
    useTheme,
    Snackbar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import { CAR_TYPES, SERVICE_TYPES } from "../../src/utils/constants";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { getPricingMatrix, updatePricingMatrix, type PricingMatrix } from "../../src/services/pricingService";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

// Initialize empty pricing matrix
const initialPricing: PricingMatrix = {};
CAR_TYPES.forEach((carType) => {
  initialPricing[carType] = {};
  SERVICE_TYPES.forEach((serviceType) => {
    initialPricing[carType][serviceType] = 0;
  });
});

export default function PricingScreen() {
  const theme = useTheme();
  const { token } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("pricing");
  const [pricing, setPricing] = useState<PricingMatrix>(initialPricing);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch pricing matrix on mount
  useEffect(() => {
    if (!token) return;

    const fetchPricing = async () => {
      try {
        setLoading(true);
        setError(null);
        const matrix = await getPricingMatrix(token);
        
        // Merge fetched data with initial structure to ensure all combinations exist
        const mergedPricing: PricingMatrix = { ...initialPricing };
        CAR_TYPES.forEach((carType) => {
          SERVICE_TYPES.forEach((serviceType) => {
            if (matrix[carType]?.[serviceType] !== undefined) {
              mergedPricing[carType][serviceType] = matrix[carType][serviceType];
            }
          });
        });
        
        setPricing(mergedPricing);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.pricing.saveFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
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
    for (const carType of CAR_TYPES) {
      for (const serviceType of SERVICE_TYPES) {
        const price = pricing[carType]?.[serviceType];
        if (price === undefined || price === null) {
          return `Price is required for ${carType} × ${serviceType}`;
        }
        if (typeof price !== "number" || price < 0 || !Number.isFinite(price)) {
          return `Price must be a non-negative number for ${carType} × ${serviceType}`;
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
      // Refresh the pricing data after save
      const matrix = await getPricingMatrix(token);
      const mergedPricing: PricingMatrix = { ...initialPricing };
      CAR_TYPES.forEach((carType) => {
        SERVICE_TYPES.forEach((serviceType) => {
          if (matrix[carType]?.[serviceType] !== undefined) {
            mergedPricing[carType][serviceType] = matrix[carType][serviceType];
          }
        });
      });
      setPricing(mergedPricing);
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
      <AdminHeader user={{ name: "John Doe" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: t("admin.vehicles"), icon: "vehicles" },
              { key: "companies", label: t("admin.companies"), icon: "companies" },
              { key: "discounts", label: t("admin.discounts"), icon: "discounts" },
              { key: "washers", label: t("admin.washers"), icon: "washers" },
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
                {SERVICE_TYPES.map((service) => (
                  <DataTable.Title key={service} style={styles.priceHeaderCell}>
                    {service}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {CAR_TYPES.map((carType) => (
                <DataTable.Row key={carType} style={styles.tableRow}>
                  <DataTable.Cell style={styles.carTypeCell}>
                    <Text style={styles.carTypeText}>{carType}</Text>
                  </DataTable.Cell>
                  {SERVICE_TYPES.map((serviceType) => (
                    <DataTable.Cell key={serviceType} style={styles.priceCell}>
                      <TextInput
                        mode="outlined"
                        value={pricing[carType]?.[serviceType]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carType, serviceType, value)}
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
              {CAR_TYPES.map((carType) => (
                <View key={carType} style={styles.mobileCard}>
                  <Text variant="titleMedium" style={styles.mobileCarType}>
                    {carType}
                  </Text>
                  {SERVICE_TYPES.map((serviceType) => (
                    <View key={serviceType} style={styles.mobilePriceRow}>
                      <Text variant="bodyMedium" style={styles.mobileServiceLabel}>
                        {serviceType}:
                      </Text>
                      <TextInput
                        mode="outlined"
                        value={pricing[carType]?.[serviceType]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carType, serviceType, value)}
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

