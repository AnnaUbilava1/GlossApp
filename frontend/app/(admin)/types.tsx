import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  IconButton,
  Text,
  TextInput,
  Snackbar,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  TypeConfig,
  getCarTypeConfigs,
  getWashTypeConfigs,
  createCarTypeConfig,
  createWashTypeConfig,
  updateCarTypeConfig,
  updateWashTypeConfig,
  deleteCarTypeConfig,
  deleteWashTypeConfig,
} from "../../src/services/typeConfigService";
import MasterPinModal from "../../src/components/MasterPinModal";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

type EditTarget =
  | { kind: "car"; type: TypeConfig | null }
  | { kind: "wash"; type: TypeConfig | null }
  | null;

export default function TypesScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState("types");
  const [carTypes, setCarTypes] = useState<TypeConfig[]>([]);
  const [washTypes, setWashTypes] = useState<TypeConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [formCode, setFormCode] = useState("");
  const [formNameKa, setFormNameKa] = useState("");
  const [formNameEn, setFormNameEn] = useState("");
  const [formSortOrder, setFormSortOrder] = useState<string>("0");
  const [formIsActive, setFormIsActive] = useState(true);

  const [pendingAction, setPendingAction] = useState<
    | null
    | { kind: "create-car" | "create-wash" | "update-car" | "update-wash" | "delete-car" | "delete-wash"; id?: string }
  >(null);
  const [masterPinVisible, setMasterPinVisible] = useState(false);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [cars, washes] = await Promise.all([
          getCarTypeConfigs(token),
          getWashTypeConfigs(token),
        ]);
        setCarTypes(cars);
        setWashTypes(washes);
      } catch (e) {
        setError(e instanceof Error ? e.message : t("admin.types.loadFailed"));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleAdminTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    } else if (key === "types") {
      // already here
    }
  };

  const resetForm = () => {
    setEditTarget(null);
    setFormCode("");
    setFormNameKa("");
    setFormNameEn("");
    setFormSortOrder("0");
    setFormIsActive(true);
  };

  const openEdit = (kind: "car" | "wash", type?: TypeConfig) => {
    if (type) {
      setEditTarget({ kind, type });
      setFormCode(type.code);
      setFormNameKa(type.displayNameKa);
      setFormNameEn(type.displayNameEn);
      setFormSortOrder(String(type.sortOrder ?? 0));
      setFormIsActive(type.isActive);
    } else {
      setEditTarget({ kind, type: null });
      setFormCode("");
      setFormNameKa("");
      setFormNameEn("");
      setFormSortOrder("0");
      setFormIsActive(true);
    }
  };

  const confirmWithPin = (
    action:
      | "create-car"
      | "create-wash"
      | "update-car"
      | "update-wash"
      | "delete-car"
      | "delete-wash",
    id?: string
  ) => {
    setPendingAction({ kind: action, id });
    setMasterPinVisible(true);
  };

  const handleMasterPin = async (pin: string) => {
    if (!token || !pendingAction) return;
    setMasterPinVisible(false);
    const { kind, id } = pendingAction;
    setPendingAction(null);

    try {
      setLoading(true);
      setError(null);

      const sortOrderNumber = Number(formSortOrder || "0");

      if (kind === "create-car") {
        const created = await createCarTypeConfig(token, pin, {
          code: formCode.trim(),
          displayNameKa: formNameKa.trim(),
          displayNameEn: formNameEn.trim(),
          isActive: formIsActive,
          sortOrder: Number.isFinite(sortOrderNumber) ? sortOrderNumber : 0,
        });
        setCarTypes((prev) => [...prev, created]);
        setSuccess(t("admin.types.carCreated"));
      } else if (kind === "create-wash") {
        const created = await createWashTypeConfig(token, pin, {
          code: formCode.trim(),
          displayNameKa: formNameKa.trim(),
          displayNameEn: formNameEn.trim(),
          isActive: formIsActive,
          sortOrder: Number.isFinite(sortOrderNumber) ? sortOrderNumber : 0,
        });
        setWashTypes((prev) => [...prev, created]);
        setSuccess(t("admin.types.washCreated"));
      } else if (kind === "update-car" && editTarget?.type) {
        const updated = await updateCarTypeConfig(token, editTarget.type.id, pin, {
          code: formCode.trim(),
          displayNameKa: formNameKa.trim(),
          displayNameEn: formNameEn.trim(),
          isActive: formIsActive,
          sortOrder: Number.isFinite(sortOrderNumber) ? sortOrderNumber : 0,
        });
        setCarTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSuccess(t("admin.types.carUpdated"));
      } else if (kind === "update-wash" && editTarget?.type) {
        const updated = await updateWashTypeConfig(token, editTarget.type.id, pin, {
          code: formCode.trim(),
          displayNameKa: formNameKa.trim(),
          displayNameEn: formNameEn.trim(),
          isActive: formIsActive,
          sortOrder: Number.isFinite(sortOrderNumber) ? sortOrderNumber : 0,
        });
        setWashTypes((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setSuccess(t("admin.types.washUpdated"));
      } else if (kind === "delete-car" && id) {
        await deleteCarTypeConfig(token, id, pin);
        setCarTypes((prev) => prev.filter((t) => t.id !== id));
        setSuccess(t("admin.types.carDeleted"));
      } else if (kind === "delete-wash" && id) {
        await deleteWashTypeConfig(token, id, pin);
        setWashTypes((prev) => prev.filter((t) => t.id !== id));
        setSuccess(t("admin.types.washDeleted"));
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("admin.types.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  const renderTypeRow = (kind: "car" | "wash", type: TypeConfig) => (
    <View key={type.id} style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.codeText}>{type.code}</Text>
        <Text style={styles.nameText}>
          {type.displayNameEn} • {type.displayNameKa}
        </Text>
        {!type.isActive && (
          <Text style={styles.inactiveBadge}>{t("admin.types.inactive")}</Text>
        )}
      </View>
      <View style={styles.rowActions}>
        <IconButton
          icon="pencil"
          size={18}
          onPress={() => openEdit(kind, type)}
        />
        <IconButton
          icon="delete"
          size={18}
          onPress={() => confirmWithPin(kind === "car" ? "delete-car" : "delete-wash", type.id)}
        />
      </View>
    </View>
  );

  const handleSubmitForm = (kind: "car" | "wash") => {
    if (!formCode.trim() || !formNameKa.trim() || !formNameEn.trim()) {
      setError(t("admin.types.requiredFields"));
      return;
    }
    const isEdit =
      editTarget && editTarget.kind === kind && editTarget.type !== null;
    if (isEdit) {
      confirmWithPin(kind === "car" ? "update-car" : "update-wash");
    } else {
      confirmWithPin(kind === "car" ? "create-car" : "create-wash");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <AdminHeader
        user={user ? { name: user.name || user.email } : { name: "Admin" }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: t("admin.vehicles"), icon: "vehicles" },
              { key: "companies", label: t("admin.companies"), icon: "companies" },
              { key: "discounts", label: t("admin.discounts"), icon: "discounts" },
              { key: "washers", label: t("admin.washers"), icon: "washers" },
              { key: "pricing", label: t("admin.pricing"), icon: "pricing" },
              { key: "types", label: t("admin.types"), icon: "types" },
              { key: "appusers", label: t("admin.appUsers"), icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleAdminTabChange}
          />

          <Text variant="titleLarge" style={styles.title}>
            {t("admin.types.pageTitle")}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t("admin.types.subtitle")}
          </Text>

          {/* Car types */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t("admin.types.carTypes")}
              </Text>
              <Button
                mode="outlined"
                onPress={() => openEdit("car")}
                compact={!isTablet}
              >
                {t("admin.types.addCarType")}
              </Button>
            </View>
            {carTypes.map((type) => renderTypeRow("car", type))}
          </View>

          {/* Wash types */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                {t("admin.types.washTypes")}
              </Text>
              <Button
                mode="outlined"
                onPress={() => openEdit("wash")}
                compact={!isTablet}
              >
                {t("admin.types.addWashType")}
              </Button>
            </View>
            {washTypes.map((type) => renderTypeRow("wash", type))}
          </View>

          {/* Edit/create form */}
          {editTarget && (
            <View style={styles.formCard}>
              <Text variant="titleMedium" style={styles.formTitle}>
                {editTarget.kind === "car"
                  ? editTarget.type
                    ? t("admin.types.editCarType")
                    : t("admin.types.newCarType")
                  : editTarget.type
                  ? t("admin.types.editWashType")
                  : t("admin.types.newWashType")}
              </Text>

              <TextInput
                mode="outlined"
                label={t("admin.types.code")}
                value={formCode}
                onChangeText={setFormCode}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label={t("admin.types.nameEn")}
                value={formNameEn}
                onChangeText={setFormNameEn}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label={t("admin.types.nameKa")}
                value={formNameKa}
                onChangeText={setFormNameKa}
                style={styles.input}
              />
              <TextInput
                mode="outlined"
                label={t("admin.types.sortOrder")}
                value={formSortOrder}
                onChangeText={setFormSortOrder}
                keyboardType="numeric"
                style={styles.input}
              />
              <View style={styles.inlineRow}>
                <Button
                  mode={formIsActive ? "contained" : "outlined"}
                  onPress={() => setFormIsActive(!formIsActive)}
                  compact
                >
                  {formIsActive
                    ? t("admin.types.active")
                    : t("admin.types.inactive")}
                </Button>
                <View style={{ flex: 1 }} />
                <Button
                  mode="text"
                  onPress={resetForm}
                  compact
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleSubmitForm(editTarget.kind)}
                  loading={loading}
                  disabled={loading}
                  compact
                >
                  {t("common.save")}
                </Button>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <MasterPinModal
        visible={masterPinVisible}
        onDismiss={() => {
          setMasterPinVisible(false);
          setPendingAction(null);
        }}
        onCorrectPin={handleMasterPin}
        title={t("admin.types.masterPinTitle")}
        description={t("admin.types.masterPinDescription")}
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
        visible={!!success}
        onDismiss={() => setSuccess(null)}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: theme.colors.primaryContainer }]}
      >
        {success}
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 4,
  },
  subtitle: {
    color: "#757575",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  rowInfo: {
    flex: 1,
  },
  codeText: {
    fontWeight: "600",
    color: "#424242",
  },
  nameText: {
    color: "#757575",
    fontSize: 13,
  },
  inactiveBadge: {
    marginTop: 2,
    fontSize: 11,
    color: "#D32F2F",
  },
  rowActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  formCard: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  formTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    marginBottom: 10,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  snackbar: {
    marginBottom: 16,
  },
});


