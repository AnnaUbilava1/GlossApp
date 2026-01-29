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
import TabNavigation from "../../src/components/TabNavigation";
import { useAuth } from "../../src/context/AuthContext";
import { apiFetch } from "../../src/utils/api";
import { CAR_TYPES, SERVICE_TYPES } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function NewRecordScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("new-record");

  // Form state (schema-first intent, legacy-string inputs mapped by backend)
  const [licensePlate, setLicensePlate] = useState("");
  const [carType, setCarType] = useState<string>("");
  const [serviceType, setServiceType] = useState<string>("");
  const [boxNumber, setBoxNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "cash" | "card">("");

  // Company + discount selection (combined dropdown)
  type DiscountOption = {
    label: string;
    companyId: string;
    discountPercent: number;
    discountId?: string;
  };
  const [discountOptions, setDiscountOptions] = useState<DiscountOption[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<DiscountOption | null>(null);

  // Washer selection
  type WasherOption = { id: number; username: string; name?: string | null };
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
      selectedDiscount?.discountPercent !== undefined
  );

  useEffect(() => {
    if (!auth.token) return;
    if (!canQuote) {
      setOriginalPrice(null);
      setDiscountedPrice(null);
      setWasherCut(null);
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

    apiFetch<{
      originalPrice: number;
      discountedPrice: number;
      washerCut: number;
    }>(`/api/pricing/quote?${params.toString()}`, { token: auth.token })
      .then((q) => {
        setOriginalPrice(q.originalPrice);
        setDiscountedPrice(q.discountedPrice);
        setWasherCut(q.washerCut);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to calculate quote"))
      .finally(() => setLoadingQuote(false));
  }, [auth.token, canQuote, carType, serviceType, selectedDiscount?.discountPercent, selectedWasher?.id]);

  const handleAddRecord = async () => {
    if (!auth.token) return;
    setError(null);

    const boxNum = boxNumber ? Number(boxNumber) : 0;
    if (!licensePlate.trim()) return setError("License plate is required");
    if (!carType) return setError("Car category is required");
    if (!serviceType) return setError("Wash type is required");
    if (!selectedWasher) return setError("Washer is required");
    if (!selectedDiscount) return setError("Company + discount is required");
    if (!Number.isInteger(boxNum) || boxNum < 0) return setError("Box number must be an integer >= 0");

    setSubmitLoading(true);
    try {
      await apiFetch("/api/records", {
        token: auth.token,
        method: "POST",
        body: JSON.stringify({
          licenseNumber: licensePlate.trim(),
          carType,
          serviceType,
          washerId: selectedWasher.id,
          companyId: selectedDiscount.companyId,
          discountPercent: selectedDiscount.discountPercent,
          boxNumber: boxNum,
          paymentMethod: paymentMethod || undefined,
        }),
      });
      router.push("/(app)/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create record");
    } finally {
      setSubmitLoading(false);
    }
  };

  function formatMoney(value: number | null) {
    if (value === null || value === undefined) return "—";
    return `$${value.toFixed(2)}`;
  }

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
            placeholder={`Select ${label.toLowerCase()}`}
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
              Select {label}
            </Text>
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
                <Text variant="bodyMedium" style={{ color: "#757575", padding: 12 }}>
                  No results
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
            <TabNavigation
              tabs={[
                { key: "new-record", label: "New Record" },
                { key: "all-records", label: "All Records", count: 0 },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            <View style={styles.formHeader}>
              <Text variant="titleLarge" style={styles.formTitle}>
                + Add New Car Wash Record
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
                  {renderInput(
                    "Car License Number",
                    licensePlate,
                    setLicensePlate,
                    "ABC-123",
                    true
                  )}

                  <SearchableSelect
                    label="Company & Discount"
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
                    "Discount Percent",
                    selectedDiscount ? `${selectedDiscount.discountPercent}%` : "—",
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    "Original Price",
                    loadingQuote ? "Calculating..." : formatMoney(originalPrice),
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    "Discounted Price",
                    loadingQuote ? "Calculating..." : formatMoney(discountedPrice),
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderInput(
                    "Washer Cut",
                    loadingQuote ? "Calculating..." : formatMoney(washerCut),
                    () => {},
                    undefined,
                    false,
                    true
                  )}
                </View>

                {/* Right Column */}
                <View style={styles.column}>
                  <SearchableSelect
                    label="Car Category"
                    required
                    valueText={carType}
                    options={[...CAR_TYPES].map((c) => ({ key: c, label: c }))}
                    onSelect={(key) => setCarType(key)}
                  />

                  <SearchableSelect
                    label="Wash Type"
                    required
                    valueText={serviceType}
                    options={[...SERVICE_TYPES].map((s) => ({ key: s, label: s }))}
                    onSelect={(key) => setServiceType(key)}
                  />

                  <SearchableSelect
                    label="Washer Username"
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
                    "Box Number",
                    boxNumber,
                    setBoxNumber,
                    "1",
                    false,
                    false
                  )}

                  <SearchableSelect
                    label="Payment Method"
                    valueText={
                      paymentMethod === "" ? "" : paymentMethod === "cash" ? "Cash" : "Card"
                    }
                    options={[
                      { key: "", label: "Not paid yet" },
                      { key: "cash", label: "Cash" },
                      { key: "card", label: "Card" },
                    ]}
                    onSelect={(key) => setPaymentMethod(key as "" | "cash" | "card")}
                  />
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
                Add Record
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

