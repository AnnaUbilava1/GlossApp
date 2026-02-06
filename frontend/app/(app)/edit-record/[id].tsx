import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../../src/components/AppHeader";
import LicenseAutocomplete from "../../../src/components/LicenseAutocomplete";
import MasterPinModal from "../../../src/components/MasterPinModal";
import { useAuth } from "../../../src/context/AuthContext";
import { useLanguage } from "../../../src/context/LanguageContext";
import { apiFetch } from "../../../src/utils/api";
import {
  type TypeConfig,
  getCarTypeConfigs,
  getWashTypeConfigs,
} from "../../../src/services/typeConfigService";

type DiscountOption = {
  label: string;
  companyId: string | null;
  discountPercent: number;
  discountId?: string;
};

type WasherOption = { id: number; username: string; name?: string | null; salaryPercentage?: number };

type LegacyRecord = {
  id: string;
  licenseNumber: string;
  carType: string;
  serviceType: string;
  companyDiscount?: string;
  discountPercent?: number;
  price: number;
  originalPrice?: number;
  washerCut?: number;
  boxNumber?: number;
  washerName: string;
  startTime: string;
  endTime?: string | null;
  isFinished: boolean;
  isPaid: boolean;
  paymentMethod?: "cash" | "card" | null;
};

type RawRecord = {
  id: string;
  companyId: string | null;
  discountId: string | null;
  discountPercentage: number;
  washerId: number;
  washerUsername: string;
  boxNumber: number;
  carCategory?: string;
  washType?: string;
  customServiceName?: string | null;
  [key: string]: unknown;
};

export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const { language, t } = useLanguage();
  
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

  const [record, setRecord] = useState<LegacyRecord | null>(null);
  const [rawRecord, setRawRecord] = useState<RawRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [licensePlate, setLicensePlate] = useState("");
  const [carType, setCarType] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [isCustomService, setIsCustomService] = useState(false);
  const [customServiceName, setCustomServiceName] = useState("");
  const [manualPrice, setManualPrice] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);
  const [washers, setWashers] = useState<WasherOption[]>([]);
  const [selectedWasher, setSelectedWasher] = useState<WasherOption | null>(null);
  const [carTypeConfigs, setCarTypeConfigs] = useState<TypeConfig[]>([]);
  const [washTypeConfigs, setWashTypeConfigs] = useState<TypeConfig[]>([]);

  const [showPinModal, setShowPinModal] = useState(false);

  useEffect(() => {
    if (!auth.token) {
      router.replace("/(auth)");
      return;
    }
  }, [auth.token]);

  const fetchRecord = useCallback(async () => {
    if (!id || !auth.token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ record: LegacyRecord; rawRecord: RawRecord }>(
        `/api/records/${id}`,
        { token: auth.token }
      );
      setRecord(data.record);
      setRawRecord(data.rawRecord);
      setLicensePlate(data.record.licenseNumber);
      const raw = data.rawRecord as RawRecord;
      setCarType(raw?.carCategory ?? data.record.carType ?? "");
      const isCustom = raw?.washType === "CUSTOM";
      setIsCustomService(!!isCustom);
      if (isCustom && raw?.customServiceName) {
        setCustomServiceName(raw.customServiceName);
        setServiceType("");
      } else {
        setServiceType(raw?.washType ?? data.record.serviceType ?? "");
        setCustomServiceName("");
      }
      // For custom services, use originalPrice (the manually entered price)
      // For regular services, price field is not editable so this doesn't matter
      const priceToUse = isCustom 
        ? (data.record.originalPrice != null ? String(data.record.originalPrice) : "")
        : (data.record.price != null ? String(data.record.price) : "");
      setManualPrice(priceToUse);
      setBoxNumber(String(raw?.boxNumber ?? data.record.boxNumber ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : t("records.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [id, auth.token]);

  useEffect(() => {
    if (!auth.token) return;
    Promise.all([
      apiFetch<{ washers: WasherOption[] }>("/api/washers", { token: auth.token }),
      apiFetch<{ options: DiscountOption[] }>("/api/discount-options", { token: auth.token }),
      getCarTypeConfigs(auth.token),
      getWashTypeConfigs(auth.token),
    ])
      .then(([w, d, cars, washes]) => {
        setWashers(w.washers);
        setDiscountOptions(d.options);
        setCarTypeConfigs(cars);
        setWashTypeConfigs(washes);
      })
      .catch(() => {});
  }, [auth.token]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  useEffect(() => {
    if (!record || !rawRecord || discountOptions.length === 0 || washers.length === 0) return;
    const discountKey = rawRecord.discountId ?? (rawRecord.companyId != null && rawRecord.discountPercentage != null
      ? `${rawRecord.companyId}:${rawRecord.discountPercentage}`
      : null);
    const opt = discountKey
      ? discountOptions.find((o) => (o.discountId ?? `${o.companyId}:${o.discountPercent}`) === discountKey)
      : discountOptions.find(
          (o) => o.discountPercent === (record.discountPercent ?? 0) && o.companyId === rawRecord.companyId
        );
    if (opt) setSelectedDiscount(opt);
    const washer = washers.find(
      (w) => w.id === rawRecord.washerId || w.username === record.washerName
    );
    if (washer) setSelectedWasher(washer);
  }, [record, rawRecord, discountOptions, washers]);

  const handleSavePress = () => {
    setError(null);
    setShowPinModal(true);
  };

  const handlePinConfirm = async (pin: string) => {
    setShowPinModal(false);
    if (!auth.token || !id || !selectedDiscount || !selectedWasher) {
      setError(t("records.missingFields"));
      return;
    }
    if (isCustomService && (!customServiceName.trim() || !manualPrice.trim())) {
      setError(t("records.customServiceRequired"));
      return;
    }
    const pricePayload = isCustomService && manualPrice.trim() ? { price: parseFloat(manualPrice) || 0 } : {};
    setSubmitLoading(true);
    setError(null);
    try {
      await apiFetch(`/api/records/${id}`, {
        token: auth.token,
        method: "PUT",
        body: JSON.stringify({
          masterPin: pin,
          licenseNumber: licensePlate.trim(),
          carCategory: carType,
          washType: isCustomService ? "CUSTOM" : serviceType,
          ...(isCustomService && { customServiceName: customServiceName.trim() }),
          companyId: selectedDiscount.companyId ?? undefined,
          discountPercent: selectedDiscount.discountPercent,
          washerId: selectedWasher.id,
          boxNumber: boxNumber === "" ? 0 : Math.max(0, parseInt(boxNumber, 10) || 0),
          ...pricePayload,
        }),
      });
      setSuccessMessage(t("records.updateSuccess"));
      setTimeout(() => {
        router.replace("/(app)/dashboard");
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("records.updateFailed"));
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
            <Divider style={{ marginVertical: isMobileLandscape ? 8 : 12 }} />
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

  if (!auth.token) return null;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
        <AppHeader
          user={auth.user ?? undefined}
          showAdminButton={auth.user?.role === "admin"}
          onLogout={() => { auth.logout(); router.replace("/(auth)"); }}
        />
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t("records.loadingRecord")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!record || !id) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
        <AppHeader
          user={auth.user ?? undefined}
          showAdminButton={auth.user?.role === "admin"}
          onLogout={() => { auth.logout(); router.replace("/(auth)"); }}
        />
        <View style={styles.centered}>
          <Text variant="bodyLarge">{t("records.recordNotFound")}</Text>
          <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>
            {t("button.back")}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AppHeader
        user={auth.user ?? undefined}
        showAdminButton={auth.user?.role === "admin"}
        onLogout={() => { auth.logout(); router.replace("/(auth)"); }}
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
            {!isMobile && (
              <View style={styles.formHeader}>
                <Text variant="titleLarge" style={styles.formTitle}>
                  {t("records.editRecordTitle")}
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
                  token={auth.token}
                  required
                  onVehicleSelected={(vehicle) => {
                    if (vehicle.carCategory) setCarType(vehicle.carCategory);
                  }}
                />
                <SearchableSelect
                  label={t("newRecord.companyDiscount")}
                  required
                  valueText={selectedDiscount?.label ?? ""}
                  options={discountOptions.map((o) => ({
                    key: o.discountId ?? `${o.companyId}:${o.discountPercent}`,
                    label: o.label,
                  }))}
                  onSelect={(key) => {
                    const opt =
                      discountOptions.find(
                        (o) => (o.discountId ?? `${o.companyId}:${o.discountPercent}`) === key
                      ) ?? null;
                    setSelectedDiscount(opt);
                  }}
                />
                <SearchableSelect
                  label={t("newRecord.carCategory")}
                  required
                  valueText={
                    carType
                      ? (carTypeConfigs.find((c) => c.code === carType)
                          ? language === "en"
                            ? carTypeConfigs.find((c) => c.code === carType)!.displayNameEn
                            : carTypeConfigs.find((c) => c.code === carType)!.displayNameKa
                          : carType)
                      : ""
                  }
                  options={[
                    ...carTypeConfigs
                      .filter((c) => c.isActive)
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((c) => ({
                        key: c.code,
                        label: language === "en" ? c.displayNameEn : c.displayNameKa,
                      })),
                  ]}
                  onSelect={setCarType}
                />
                <SearchableSelect
                  label={t("newRecord.washType")}
                  required
                  valueText={
                    isCustomService
                      ? t("newRecord.customService")
                      : serviceType
                        ? (washTypeConfigs.find((w) => w.code === serviceType)
                            ? language === "en"
                              ? washTypeConfigs.find((w) => w.code === serviceType)!.displayNameEn
                              : washTypeConfigs.find((w) => w.code === serviceType)!.displayNameKa
                            : serviceType)
                        : ""
                  }
                  options={[
                    ...washTypeConfigs
                      .filter((w) => w.isActive && w.code !== "CUSTOM")
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((w) => ({
                        key: w.code,
                        label: language === "en" ? w.displayNameEn : w.displayNameKa,
                      })),
                    { key: "__CUSTOM__", label: t("newRecord.customService") },
                  ]}
                  onSelect={(key) => {
                    if (key === "__CUSTOM__") {
                      setIsCustomService(true);
                      setServiceType("");
                      setCustomServiceName("");
                      setManualPrice("");
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
                </View>

                {/* Right Column */}
                <View style={styles.column}>
                  <SearchableSelect
                    label={t("newRecord.washerUsername")}
                    required
                    valueText={selectedWasher ? selectedWasher.username : ""}
                    options={washers.map((w) => ({ key: String(w.id), label: w.username }))}
                    onSelect={(key) => {
                      const w = washers.find((x) => x.id === Number(key)) ?? null;
                      setSelectedWasher(w);
                    }}
                  />
                  {renderInput(t("newRecord.boxNumber"), boxNumber, setBoxNumber, "0", false, false)}
                </View>
              </View>

              {/* Save Button */}
              <Button
                mode="contained"
                onPress={handleSavePress}
                style={styles.saveButton}
                contentStyle={styles.saveButtonContent}
                loading={submitLoading}
                disabled={submitLoading}
              >
                {t("button.save")}
              </Button>

              <Button mode="outlined" onPress={() => router.back()} style={styles.cancelButton}>
                {t("button.cancel")}
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

      <MasterPinModal
        visible={showPinModal}
        onDismiss={() => setShowPinModal(false)}
        onCorrectPin={(pin) => handlePinConfirm(pin)}
        title={t("records.editRecordTitle")}
        description={t("records.editRecordPinDescription")}
      />
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
    padding: isMobileLandscape ? 8 : isMobile ? 6 : isTablet ? 12 : 24,
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
  modal: {
    marginHorizontal: isMobileLandscape ? 8 : isMobile ? 12 : 16,
    borderRadius: 12,
    padding: isMobileLandscape ? 8 : isMobile ? 12 : 16,
    maxHeight: isMobileLandscape ? height * 0.6 : isMobile ? height * 0.7 : height * 0.8,
  },
  saveButton: {
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    marginTop: isMobileLandscape ? 2 : isMobile ? 0 : 8,
    alignSelf: "center",
    minWidth: isMobileLandscape ? 120 : isMobile ? 150 : 200,
  },
  saveButtonContent: {
    paddingVertical: isMobileLandscape ? 4 : isMobile ? 6 : 8,
  },
  cancelButton: {
    marginTop: isMobileLandscape ? 4 : isMobile ? 8 : 12,
    alignSelf: "center",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: isMobile ? 16 : 24,
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
