import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

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

  const { language } = useLanguage();
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
      setManualPrice(data.record.price != null ? String(data.record.price) : "");
      setBoxNumber(String(raw?.boxNumber ?? data.record.boxNumber ?? 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load record");
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
      setError("Missing required fields");
      return;
    }
    if (isCustomService && (!customServiceName.trim() || !manualPrice.trim())) {
      setError("Custom service name and price are required");
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
      setSuccessMessage("Record updated");
      setTimeout(() => {
        router.replace("/(app)/dashboard");
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update record");
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
    const filtered = query.trim()
      ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
      : options;
    return (
      <View style={styles.fieldContainer}>
        <Text variant="labelMedium" style={styles.label}>
          {label} {required && "*"}
        </Text>
        <TextInput
          mode="outlined"
          value={valueText}
          onFocus={() => setVisible(true)}
          showSoftInputOnFocus={false}
          right={<TextInput.Icon icon="menu-down" onPress={() => setVisible(true)} />}
          disabled={disabled}
          style={styles.input}
          contentStyle={styles.inputContent}
        />
        <Modal visible={visible} onDismiss={() => setVisible(false)} contentContainerStyle={styles.modal}>
          <Text variant="titleMedium" style={{ marginBottom: 8 }}>{label}</Text>
          <TextInput
            mode="outlined"
            placeholder="Search..."
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
              <Text variant="bodyMedium" style={{ color: "#757575", padding: 12 }}>No results</Text>
            )}
          </ScrollView>
        </Modal>
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
          <Text variant="bodyLarge">Loading record...</Text>
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
          <Text variant="bodyLarge">Record not found</Text>
          <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 16 }}>
            Back
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
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleLarge" style={styles.formTitle}>
              Edit Record
            </Text>

            {(error || successMessage) && (
              <Text
                variant="bodySmall"
                style={{
                  color: error ? "#D32F2F" : "#2E7D32",
                  marginBottom: 12,
                }}
              >
                {error ?? successMessage}
              </Text>
            )}

            <View style={styles.twoColumnContainer}>
              <View style={styles.column}>
                <LicenseAutocomplete
                  value={licensePlate}
                  onChange={setLicensePlate}
                  token={auth.token}
                  required
                  onVehicleSelected={(vehicle) => {
                    if (vehicle.carCategory) setCarType(vehicle.carCategory);
                  }}
                />
                <SearchableSelect
                  label="Company & Discount"
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
                  label="Car Category"
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
                  label="Wash Type"
                  required
                  valueText={
                    isCustomService
                      ? "Custom Service"
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
                    { key: "__CUSTOM__", label: "Custom Service" },
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
                      "Custom Service Name",
                      customServiceName,
                      setCustomServiceName,
                      "e.g., Special Detail, Wax, etc.",
                      true,
                      false
                    )}
                    {renderInput(
                      "Price (Manual Entry)",
                      manualPrice,
                      setManualPrice,
                      "0.00",
                      true,
                      false
                    )}
                  </>
                )}
              </View>
              <View style={styles.column}>
                <SearchableSelect
                  label="Washer"
                  required
                  valueText={selectedWasher ? selectedWasher.username : ""}
                  options={washers.map((w) => ({ key: String(w.id), label: w.username }))}
                  onSelect={(key) => {
                    const w = washers.find((x) => x.id === Number(key)) ?? null;
                    setSelectedWasher(w);
                  }}
                />
                {renderInput("Box Number", boxNumber, setBoxNumber, "0", false, false)}
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleSavePress}
              style={styles.saveButton}
              contentStyle={styles.saveButtonContent}
              loading={submitLoading}
              disabled={submitLoading}
            >
              Save Changes
            </Button>

            <Button mode="outlined" onPress={() => router.back()} style={{ marginTop: 12 }}>
              Cancel
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <MasterPinModal
        visible={showPinModal}
        onDismiss={() => setShowPinModal(false)}
        onCorrectPin={(pin) => handlePinConfirm(pin)}
        title="Edit Record"
        description="Enter Master PIN to save changes"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: isTablet ? 24 : 16 },
  card: {
    borderRadius: 12,
    padding: isTablet ? 32 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  formTitle: { fontWeight: "bold", marginBottom: 24, color: "#212121" },
  twoColumnContainer: { flexDirection: isTablet ? "row" : "column", gap: 16, marginBottom: 24 },
  column: { flex: 1, gap: 0 },
  fieldContainer: { marginBottom: 20 },
  label: { marginBottom: 8, color: "#424242", fontWeight: "500" },
  input: { backgroundColor: "#FAFAFA" },
  inputContent: { backgroundColor: "#FAFAFA" },
  modal: { marginHorizontal: 16, borderRadius: 12, padding: 16, backgroundColor: "#fff" },
  saveButton: { backgroundColor: "#2F80ED", borderRadius: 8, alignSelf: "center", minWidth: 200 },
  saveButtonContent: { paddingVertical: 8 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
});
