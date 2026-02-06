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
  Snackbar,
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
import {
  CAR_TYPES,
  SERVICE_TYPES,
  formatMoney,
  getCarTypeLabel,
  getServiceTypeLabel,
  SCHEMA_CAR_TYPE_TO_LEGACY,
  SCHEMA_WASH_TYPE_TO_LEGACY,
} from "../../src/utils/constants";
import {
  type TypeConfig,
  getCarTypeConfigs,
  getWashTypeConfigs,
} from "../../src/services/typeConfigService";

// These will be calculated dynamically in the component

export default function NewRecordScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("new-record");
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
      // Update styles when dimensions change
      styles = createStyles(
        window.width < 600,
        window.width < 600 && window.width > window.height,
        window.width >= 600 && window.width < 1024,
        window.width >= 1024,
        window.height
      );
    });
    return () => subscription?.remove();
  }, []);

  // Calculate responsive breakpoints dynamically
  const isMobile = screenDimensions.width < 600;
  const isMobileLandscape = isMobile && screenDimensions.width > screenDimensions.height;
  const isTablet = screenDimensions.width >= 600 && screenDimensions.width < 1024;
  const isDesktop = screenDimensions.width >= 1024;
  
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

  const [carTypeConfigs, setCarTypeConfigs] = useState<TypeConfig[] | null>(null);
  const [washTypeConfigs, setWashTypeConfigs] = useState<TypeConfig[] | null>(null);

  // Auto-filled pricing
  const [originalPrice, setOriginalPrice] = useState<number | null>(null);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [washerCut, setWasherCut] = useState<number | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [loadingInit, setLoadingInit] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    const token = auth.token;
    if (!token) return;
    const fetchInit = async () => {
      try {
        setLoadingInit(true);
        setError(null);
        const [w, d, carCfg, washCfg] = await Promise.all([
          apiFetch<{ washers: WasherOption[] }>("/api/washers", { token }),
          apiFetch<{ options: DiscountOption[] }>("/api/discount-options", { token }),
          getCarTypeConfigs(token).catch(() => null),
          getWashTypeConfigs(token).catch(() => null),
        ]);
        setWashers(w.washers);
        setDiscountOptions(d.options);
        if (Array.isArray(carCfg)) {
          setCarTypeConfigs(carCfg);
        }
        if (Array.isArray(washCfg)) {
          setWashTypeConfigs(washCfg);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load form data");
      } finally {
        setLoadingInit(false);
      }
    };

    fetchInit();
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
      carCategory: carType,
      washType: serviceType,
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
        carCategory: carType,
        washType: isCustomService ? "CUSTOM" : serviceType,
        washerId: selectedWasher.id,
        companyId: selectedDiscount.companyId || undefined,
        discountPercent: selectedDiscount.discountPercent,
        boxNumber: boxNum,
      };
      if (isCustomService) {
        requestBody.customServiceName = customServiceName.trim();
      }

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
      setSuccessMessage(t("newRecord.success"));
      
      // Clear form after successful submission
      setLicensePlate("");
      setCarType("");
      setServiceType("");
      setIsCustomService(false);
      setCustomServiceName("");
      setManualPrice("");
      setBoxNumber("");
      setSelectedDiscount(null);
      setSelectedWasher(null);
      setOriginalPrice(null);
      setDiscountedPrice(null);
      setWasherCut(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("newRecord.error.createFailed"));
    } finally {
      setSubmitLoading(false);
    }
  };

  const availableCarTypes = useMemo(() => {
    if (carTypeConfigs && carTypeConfigs.length > 0) {
      const fromConfig = carTypeConfigs
        .filter((cfg) => cfg.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((cfg) => cfg.code);
      return [...new Set(fromConfig)];
    }
    return [...CAR_TYPES];
  }, [carTypeConfigs]);

  const getCarTypeDisplayLabel = (code: string) => {
    const cfg = carTypeConfigs?.find((c) => c.code === code);
    if (cfg) {
      return language === "en" ? cfg.displayNameEn : cfg.displayNameKa;
    }
    return getCarTypeLabel(SCHEMA_CAR_TYPE_TO_LEGACY[code] ?? code, language);
  };

  const availableWashTypes = useMemo(() => {
    if (washTypeConfigs && washTypeConfigs.length > 0) {
      const fromConfig = washTypeConfigs
        .filter((cfg) => cfg.isActive && cfg.code !== "CUSTOM")
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((cfg) => cfg.code);
      return [...new Set(fromConfig)];
    }
    return [...SERVICE_TYPES];
  }, [washTypeConfigs]);

  const getWashTypeDisplayLabel = (code: string) => {
    const cfg = washTypeConfigs?.find((c) => c.code === code);
    if (cfg) {
      return language === "en" ? cfg.displayNameEn : cfg.displayNameKa;
    }
    return getServiceTypeLabel(SCHEMA_WASH_TYPE_TO_LEGACY[code] ?? code, language);
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
        <Text variant="labelMedium" style={styles.label} numberOfLines={2} ellipsizeMode="tail">
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
            pointerEvents="none"
            style={styles.input}
            contentStyle={styles.inputContent}
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
            <Text variant="titleMedium" style={{ marginBottom: isMobileLandscape ? 8 : 12, fontSize: isMobileLandscape ? 14 : undefined }}>
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
            <Divider style={{ marginVertical: isMobileLandscape ? 8 : 52 }} />
            <ScrollView style={{ maxHeight: isMobileLandscape ? screenDimensions.height * 0.5 : isMobile ? screenDimensions.height * 0.4 : 360 }}>
              {filtered.map((o) => (
                <List.Item
                  key={o.key}
                  title={o.label}
                  titleStyle={{ fontSize: isMobileLandscape ? 12 : isMobile ? 14 : undefined }}
                  onPress={() => {
                    onSelect(o.key);
                    setVisible(false);
                    setQuery("");
                  }}
                />
              ))}
              {filtered.length === 0 && (
                <Text variant="bodyMedium" style={{ color: "#757575", padding: isMobileLandscape ? 6 : isMobile ? 8 : 12, fontSize: isMobileLandscape ? 11 : isMobile ? 13 : undefined }}>
                  {t("newRecord.noResults")}
                </Text>
              )}
            </ScrollView>
          </Modal>
        </Portal>
      </View>
    );
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    required = false,
    disabled = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label} numberOfLines={2} ellipsizeMode="tail">
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TabNavigation
              tabs={[
                { key: "new-record", label: t("tabs.newRecord") },
                { key: "all-records", label: t("tabs.allRecords"), count: records.length },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            {!isMobile && (
              <View style={styles.formHeader}>
                <Text variant="titleLarge" style={styles.formTitle}>
                  {t("newRecord.title")}
                </Text>
              </View>
            )}

            <View style={styles.formContainer}>
              {!!error && (
                <Text variant="bodySmall" style={{ color: "#D32F2F", marginBottom: 12 }}>
                  {error}
                </Text>
              )}

              {/* Two Column Layout */}
              <View style={styles.twoColumnContainer}>
                {/* Left Column */}
                <View style={[styles.column, styles.leftcolumn]}>
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
                    valueText={carType ? getCarTypeDisplayLabel(carType) : ""}
                    options={availableCarTypes.map((c) => ({
                      key: c,
                      label: getCarTypeDisplayLabel(c),
                    }))}
                    onSelect={(key) => setCarType(key)}
                  />

                  <SearchableSelect
                    label={t("newRecord.washType")}
                    required
                    valueText={
                      isCustomService
                        ? t("newRecord.customService")
                        : serviceType
                        ? getWashTypeDisplayLabel(serviceType)
                        : ""
                    }
                    options={[
                      ...availableWashTypes.map((s) => ({
                        key: s,
                        label: getWashTypeDisplayLabel(s),
                      })),
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

      <Snackbar
        visible={!!successMessage}
        onDismiss={() => setSuccessMessage(null)}
        duration={3000}
        style={{ marginBottom: 16 }}
      >
        {successMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

// Create styles function that uses screen dimensions
const createStyles = (isMobile: boolean, isMobileLandscape: boolean, isTablet: boolean, isDesktop: boolean, height: number) => StyleSheet.create({
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
    padding: isMobileLandscape ? 8 : isMobile ? 4 : isTablet ? 12 : 24,
    paddingHorizontal: isMobileLandscape ? 12 : undefined,
  },
  card: {
    borderRadius: 12,
    padding: isMobileLandscape ? 12 : isMobile ? 10 : isTablet ? 16 : 32,
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
    marginBottom: isMobileLandscape ? 8 : isMobile ? 12 : isTablet ? 16 : 24,
  },
  formTitle: {
    fontWeight: "bold",
    color: "#212121",
    fontSize: isMobileLandscape ? 16 : isMobile ? 18 : undefined,
  },
  formContainer: {
    width: "90%",
    alignSelf: "center",
  },
  twoColumnContainer: {
    flexDirection: isMobileLandscape ? "row" : isMobile ? "column" : isTablet ? "row" : "row",
    gap: isMobileLandscape ? 8 : isMobile ? 6 : isTablet ? 12 : 16,
    marginBottom: isMobileLandscape ? 8 : isMobile ? 0 : isTablet ? 12 : 24,
  },
  column: {
    flex: 1,
    gap: 0,
    minWidth: isMobileLandscape ? 0 : undefined,
  },
  leftcolumn: {
    marginBottom: isMobileLandscape ? 8 : isMobile ? 2 : isTablet ? 12 : 24,
  },
  fieldContainer: {
    marginBottom: isMobileLandscape ? 4 : isMobile ? 4 : isTablet ? 12 : 20,
    minHeight: isMobile && !isMobileLandscape ? 70 : undefined,
  },
  label: {
    marginBottom: isMobileLandscape ? 3 : isMobile ? 4 : isTablet ? 6 : 8,
    color: "#424242",
    fontWeight: "500",
    fontSize: isMobileLandscape ? 11 : isMobile ? 12 : isTablet ? 13 : undefined,
    flexWrap: "wrap",
    flexShrink: 1,
  },
  input: {
    backgroundColor: "#FAFAFA",
    height: isMobileLandscape ? 36 : isMobile ? 44 : isTablet ? 48 : undefined,
  },
  inputContent: {
    backgroundColor: "#FAFAFA",
    fontSize: isMobileLandscape ? 12 : isMobile ? 14 : undefined,
    paddingVertical: isMobileLandscape ? 4 : isMobile ? 8 : undefined,
  },
  dropdownContainer: {
    position: "relative",
  },
  modal: {
    marginHorizontal: isMobileLandscape ? 8 : isMobile ? 12 : 16,
    borderRadius: 12,
    padding: isMobileLandscape ? 8 : isMobile ? 12 : 16,
    maxHeight: isMobileLandscape ? height * 0.6 : isMobile ? height * 0.7 : height * 0.8,
  },
  addButton: {
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    marginTop: isMobileLandscape ? 2 : isMobile ? 0 : 8,
    alignSelf: "center",
    minWidth: isMobileLandscape ? 120 : isMobile ? 150 : 200,
  },
  addButtonContent: {
    paddingVertical: isMobileLandscape ? 4 : isMobile ? 6 : 8,
  },
});

// Initialize styles - will be recalculated on dimension changes
let styles = createStyles(
  Dimensions.get("window").width < 600,
  Dimensions.get("window").width < 600 && Dimensions.get("window").width > Dimensions.get("window").height,
  Dimensions.get("window").width >= 600 && Dimensions.get("window").width < 1024,
  Dimensions.get("window").width >= 1024,
  Dimensions.get("window").height
);

