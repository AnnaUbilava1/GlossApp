import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Divider,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../src/components/AppHeader";
import LicenseAutocomplete from "../../src/components/LicenseAutocomplete";
import TabNavigation from "../../src/components/TabNavigation";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import { apiFetch } from "../../src/utils/api";
import { useDashboard } from "../../src/hooks/useDashboard";
import { CAR_TYPES, formatMoney, SERVICE_TYPES } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function NewRecordScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("new-record");
  
  // Get record count for tab display
  const { records } = useDashboard(auth.token);

  // Form state (schema-first intent, legacy-string inputs mapped by backend)
  const [licensePlate, setLicensePlate] = useState("");
  const [carType, setCarType] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState<string>("");
  const [manualPrice, setManualPrice] = useState<string>("");
  const [boxNumber, setBoxNumber] = useState<string>("");

  // Company + discount selection (combined dropdown)
  type DiscountOption = {
    label: string;
    companyId: string | null;
    discountPercent: number;
    discountId?: string;
  };
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);

  // Washer selection
  type WasherOption = { id: number; username: string; name?: string | null; salaryPercentage?: number };
  const [washers, setWashers] = useState<WasherOption[]>([]);
  const [selectedWasher, setSelectedWasher] = useState<WasherOption | null>(null);

  // Auto-filled pricing
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [washerCut, setWasherCut] = useState<number | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [loadingInit, setLoadingInit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "all-records") {
      router.push("/(app)/dashboard");
    }
  };

  useEffect(() => {
    if (!auth.token) {
      router.replace("/(auth)");
    }
  }, [auth.token]);

  useEffect(() => {
    if (!auth.token) return;
    setLoadingInit(true);
    setError(null);
    Promise.all([
      apiFetch<{ washers: WasherOption[] }>("/api/washers", { token: auth.token }),
      apiFetch<{ options: DiscountOption[] }>("/api/discount-options", { token: auth.token }),
    ])
      .then(([w, d]) => {
        setWashers(w.washers);
        setDiscountOptions(d.options);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load form data"))
      .finally(() => setLoadingInit(false));
  }, [auth.token]);

  const canQuote = Boolean(
    auth.token &&
      carType &&
      serviceType &&
      selectedWasher?.id &&
      selectedDiscount?.discountPercent !== undefined &&
      !isCustomService // Don't auto-quote for custom services
  );

  // Calculate prices for custom service
  useEffect(() => {
    if (!isCustomService || !manualPrice) {
      if (!isCustomService) {
        // Reset prices when switching away from custom service
        return;
      }
      return;
    }
    
    const price = parseFloat(manualPrice);
    if (isNaN(price) || price <= 0) {
      setOriginalPrice(null);
      setDiscountedPrice(null);
      setWasherCut(null);
      return;
    }

    const discountPct = selectedDiscount?.discountPercent ?? 0;
    const discounted = Math.max(0, price * (1 - discountPct / 100));
    setOriginalPrice(price);
    setDiscountedPrice(discounted);

    // Calculate washer cut if washer is selected
    if (selectedWasher) {
      // Use already-loaded washers data to get salary percentage
      const washer = washers.find((w) => w.id === selectedWasher.id);
      if (washer && 'salaryPercentage' in washer) {
        const washerPct = (washer as any).salaryPercentage || 0;
        const washerCut = Math.max(0, price * (washerPct / 100));
        setWasherCut(washerCut);
      } else {
        setWasherCut(0);
      }
    } else {
      setWasherCut(null);
    }
  }, [isCustomService, manualPrice, selectedDiscount?.discountPercent, selectedWasher, washers]);

  useEffect(() => {
    if (!auth.token) return;
    if (!canQuote) {
      if (!isCustomService) {
        setOriginalPrice(null);
        setDiscountedPrice(null);
        setWasherCut(null);
      }
      return;
    }

    setLoadingQuote(true);
    setError(null);
    const params = new URLSearchParams({
      carType,
      serviceType,
      discountPercent: String(selectedDiscount?.discountPercent ?? 0),
      washerId: String(selectedWasher?.id ?? ""),
    });

    const quoteUrl = `/api/pricing/quote?${params.toString()}`;
    console.log("Requesting pricing quote:", quoteUrl);

    apiFetch<{
      originalPrice: number;
      discountedPrice: number;
      washerCut: number;
    }>(quoteUrl, { token: auth.token })
      .then((q) => {
        console.log("Pricing quote response:", q);
        if (q && typeof q.originalPrice === 'number' && q.originalPrice > 0) {
          setOriginalPrice(q.originalPrice);
          setDiscountedPrice(q.discountedPrice);
          setWasherCut(q.washerCut);
        } else {
          console.error("Invalid quote response:", q);
          setError(`Invalid pricing quote: ${JSON.stringify(q)}`);
          setOriginalPrice(null);
          setDiscountedPrice(null);
          setWasherCut(null);
        }
      })
      .catch((e) => {
        console.error("Pricing quote error:", e);
        const errorMsg = e instanceof Error ? e.message : "Failed to calculate quote";
        setError(errorMsg);
        setOriginalPrice(null);
        setDiscountedPrice(null);
        setWasherCut(null);
      })
      .finally(() => setLoadingQuote(false));
  }, [auth.token, canQuote, carType, serviceType, selectedDiscount?.discountPercent, selectedWasher?.id]);

  const handleAddRecord = async () => {
    if (!auth.token) return;
    setError(null);

    const boxNum = boxNumber ? Number(boxNumber) : 0;
    if (!licensePlate.trim()) return setError(t("newRecord.error.licenseRequired"));
    if (!carType) return setError(t("newRecord.error.carCategoryRequired"));
    if (isCustomService) {
      if (!customServiceName.trim()) return setError(t("newRecord.error.customNameRequired"));
      if (!manualPrice.trim()) return setError(t("newRecord.error.priceRequired"));
    } else {
      if (!serviceType) return setError(t("newRecord.error.washTypeRequired"));
    }
    if (!selectedWasher) return setError(t("newRecord.error.washerRequired"));
    if (!selectedDiscount) return setError(t("newRecord.error.companyDiscountRequired"));
    if (!Number.isInteger(boxNum) || boxNum < 0) return setError("Box number must be an integer >= 0");

    // Validate manual price if custom service
    if (isCustomService) {
      const price = parseFloat(manualPrice);
      if (isNaN(price) || price <= 0) {
        return setError(t("newRecord.error.pricePositive"));
      }
    }

    setSubmitLoading(true);
    try {
      const requestBody: any = {
        licenseNumber: licensePlate.trim(),
        carType,
        serviceType: isCustomService ? customServiceName.trim() : serviceType,
        washerId: selectedWasher.id,
        companyId: selectedDiscount.companyId || undefined,
        discountPercent: selectedDiscount.discountPercent,
        boxNumber: boxNum,
      };

      // If custom service, always include manual price (required for backend to detect custom service)
      if (isCustomService) {
        if (!manualPrice || manualPrice.trim() === "") {
          return setError(t("newRecord.error.priceRequired"));
        }
        const price = parseFloat(manualPrice);
        if (isNaN(price) || price < 0) {
          return setError(t("newRecord.error.priceValid"));
        }
        requestBody.price = price;
      }

      await apiFetch("/api/records", {
        token: auth.token,
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      router.push("/(app)/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : t("newRecord.error.createFailed"));
    } finally {
      setSubmitLoading(false);
    }
  };


  function SearchableSelect({
    label,
    valueText,
    options,
    onSelect,
    required,
    disabled,
  }: {
    label: string;
    valueText: string;
    options: { key: string; label: string }[];
    onSelect: (key: string) => void;
    required?: boolean;
    disabled?: boolean;
  }) {
    const [visible, setVisible] = useState(false);
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      if (!q) return options;
      return options.filter((o) => o.label.toLowerCase().includes(q));
    }, [options, query]);

    return (
      <View style={styles.fieldContainer}>
        <Text variant="labelMedium" style={styles.label}>
          {label} {required && "*"}
        </Text>
        <TouchableOpacity
          disabled={disabled}
          onPress={() => setVisible(true)}
          style={{ opacity: disabled ? 0.6 : 1 }}
        >
          <TextInput
            mode="outlined"
            placeholder={`${t("newRecord.selectPlaceholder")} ${label}`}
            value={valueText}
            editable={false}
            style={styles.input}
            contentStyle={styles.inputContent}
            right={<TextInput.Icon icon="chevron-down" />}
          />
        </TouchableOpacity>

        <Portal>
          <Modal
            visible={visible}
            onDismiss={() => {
              setVisible(false);
              setQuery("");
            }}
            contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="titleMedium" style={{ marginBottom: 12 }}>
              {t("newRecord.selectPlaceholder")} {label}
            </Text>
            <TextInput
              mode="outlined"
              placeholder={t("newRecord.searchPlaceholder")}
              value={query}
              onChangeText={setQuery}
              style={styles.input}
              contentStyle={styles.inputContent}
            />
            <Divider style={{ marginVertical: 12 }} />
            <ScrollView style={{ maxHeight: 360 }}>
              {filtered.map((o) => (
                <List.Item
                  key={o.key}
                  title={o.label}
                  onPress={() => {
                    onSelect(o.key);
                    setVisible(false);
                    setQuery("");
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <Text variant="bodyMedium" style={{ color: "#757575", padding: 12 }}>
                  {t("newRecord.noResults")}
                </Text>
              )}
            </ScrollView>
          </Modal>
        </Portal>
      </View>
    );
  }

  const renderInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    required = false,
    disabled = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label}>
        {label} {required && "*"}
      </Text>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        disabled={disabled}
        style={styles.input}
        contentStyle={styles.inputContent}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AppHeader
        user={auth.user || undefined}
        showAdminButton={auth.user?.role === "admin"}
        onLogout={() => {
          auth.logout();
          router.replace("/(auth)");
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <            TabNavigation
              tabs={[
                { key: "new-record", label: t("tabs.newRecord") },
                { key: "all-records", label: t("tabs.allRecords"), count: records.length },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            <View style={styles.formHeader}>
              <Text variant="titleLarge" style={styles.formTitle}>
                {t("newRecord.title")}
              </Text>
            </View>

            <View style={styles.formContainer}>
              {!!error && (
                <Text variant="bodySmall" style={{ color: "#D32F2F", marginBottom: 12 }}>
                  {error}
                </Text>
              )}

              {/* Two Column Layout */}
              <View style={styles.twoColumnContainer}>
                {/* Left Column */}
                <View style={styles.column}>
                  <LicenseAutocomplete
                    label={t("newRecord.licensePlate")}
                    value={licensePlate}
                    onChange={setLicensePlate}
                    token={auth.token!}
                    required
                    onVehicleSelected={(vehicle) => {
                      // Auto-fill car category when vehicle is found
                      if (vehicle.carCategory) {
                        setCarType(vehicle.carCategory);
                      }
                    }}
                  />

                  <SearchableSelect
                    label={t("newRecord.companyDiscount")}
                    required
                    disabled={loadingInit}
                    valueText={selectedDiscount?.label || ""}
                    options={discountOptions.map((o) => ({
                      key: o.discountId || `${o.companyId}:${o.discountPercent}`,
                      label: o.label,
                    }))}
                    onSelect={(key) => {
                      const opt =
                        discountOptions.find((o) => (o.discountId || `${o.companyId}:${o.discountPercent}`) === key) ||
                        null;
                      setSelectedDiscount(opt);
                    }}
                  />

                  {renderInput(
                    t("newRecord.discountPercent"),
                    selectedDiscount ? `${selectedDiscount.discountPercent}%` : "—",
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    t("newRecord.originalPrice"),
                    loadingQuote ? t("newRecord.calculating") : formatMoney(originalPrice),
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    t("newRecord.discountedPrice"),
                    loadingQuote ? t("newRecord.calculating") : formatMoney(discountedPrice),
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    t("newRecord.washerCut"),
                    loadingQuote ? t("newRecord.calculating") : formatMoney(washerCut),
                    () => {},
                    undefined,
                    false,
                    true
                  )}
                </View>

                {/* Right Column */}
                <View style={styles.column}>
                  <SearchableSelect
                    label={t("newRecord.carCategory")}
                    required
                    valueText={carType}
                    options={[...CAR_TYPES].map((c) => ({ key: c, label: c }))}
                    onSelect={(key) => setCarType(key)}
                  />

                  <SearchableSelect
                    label={t("newRecord.washType")}
                    required
                    valueText={isCustomService ? t("newRecord.customService") : serviceType}
                    options={[
                      ...SERVICE_TYPES.map((s) => ({ key: s, label: s })),
                      { key: "__CUSTOM__", label: t("newRecord.customService") },
                    ]}
                    onSelect={(key) => {
                      if (key === "__CUSTOM__") {
                        setIsCustomService(true);
                        setServiceType("");
                        setCustomServiceName("");
                        setManualPrice("");
                        setOriginalPrice(null);
                        setDiscountedPrice(null);
                        setWasherCut(null);
                      } else {
                        setIsCustomService(false);
                        setServiceType(key);
                        setCustomServiceName("");
                        setManualPrice("");
                      }
                    }}
                  />

                  {isCustomService && (
                    <>
                      {renderInput(
                        t("newRecord.customServiceName"),
                        customServiceName,
                        setCustomServiceName,
                        t("newRecord.customServicePlaceholder"),
                        true,
                        false
                      )}
                      {renderInput(
                        t("newRecord.priceManual"),
                        manualPrice,
                        setManualPrice,
                        "0.00",
                        true,
                        false
                      )}
                    </>
                  )}

                  <SearchableSelect
                    label={t("newRecord.washerUsername")}
                    required
                    disabled={loadingInit}
                    valueText={selectedWasher ? selectedWasher.username : ""}
                    options={washers.map((w) => ({ key: String(w.id), label: w.username }))}
                    onSelect={(key) => {
                      const id = Number(key);
                      const w = washers.find((x) => x.id === id) || null;
                      setSelectedWasher(w);
                    }}
                  />

                  {renderInput(
                    t("newRecord.boxNumber"),
                    boxNumber,
                    setBoxNumber,
                    "1",
                    false,
                    false
                  )}

                </View>
              </View>

              {/* Add Record Button */}
              <Button
                mode="contained"
                onPress={handleAddRecord}
                style={styles.addButton}
                contentStyle={styles.addButtonContent}
                loading={submitLoading}
                disabled={submitLoading || loadingInit}
              >
                {t("newRecord.addRecord")}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontWeight: "bold",
    color: "#212121",
  },
  formContainer: {
    width: "100%",
  },
  twoColumnContainer: {
    flexDirection: isTablet ? "row" : "column",
    gap: 16,
    marginBottom: 24,
  },
  column: {
    flex: 1,
    gap: 0,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: "#424242",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FAFAFA",
  },
  inputContent: {
    backgroundColor: "#FAFAFA",
  },
  dropdownContainer: {
    position: "relative",
  },
  modal: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  addButton: {
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "center",
    minWidth: 200,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
});

