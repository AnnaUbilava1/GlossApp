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
    IconButton,
    Text,
    useTheme,
    Snackbar,
    Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import WasherFormModal from "../../src/components/WasherFormModal";
import MasterPinModal from "../../src/components/MasterPinModal";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  getAllWashers,
  createWasher,
  updateWasher,
  deleteWasher,
  type Washer,
  type CreateWasherPayload,
  type UpdateWasherPayload,
} from "../../src/services/washerService";
import { MASTER_PIN } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function WashersScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("washers");
  const [washers, setWashers] = useState<Washer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingWasher, setEditingWasher] = useState<Washer | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(null);
  const [washerToDelete, setWasherToDelete] = useState<number | null>(null);

  // Fetch washers on mount and when token changes
  useEffect(() => {
    if (!token) return;

    const fetchWashers = async () => {
      try {
        setLoading(true);
        setError(null);
        const allWashers = await getAllWashers(token, true); // Admin sees all
        setWashers(allWashers);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.washers.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchWashers();
  }, [token]);

  const refreshWashers = async () => {
    if (!token) return;
    try {
      const allWashers = await getAllWashers(token, true);
      setWashers(allWashers);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.washers.loadFailed"));
    }
  };

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      // Already here
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handleAddWasher = async (payload: CreateWasherPayload | UpdateWasherPayload) => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      // Ensure username is provided and trimmed
      const createPayload: CreateWasherPayload = {
        username: (payload as CreateWasherPayload).username?.trim() || "",
        name: (payload as CreateWasherPayload).name || (payload as UpdateWasherPayload).name,
        surname: (payload as CreateWasherPayload).surname || (payload as UpdateWasherPayload).surname,
        contact: (payload as CreateWasherPayload).contact || (payload as UpdateWasherPayload).contact,
        salaryPercentage: (payload as CreateWasherPayload).salaryPercentage || (payload as UpdateWasherPayload).salaryPercentage,
      };

      if (!createPayload.username) {
        throw new Error(t("admin.washers.usernameRequired"));
      }

      await createWasher(token, createPayload);
      setSuccessMessage(t("admin.washers.addSuccess"));
      await refreshWashers();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleEditWasher = async (payload: CreateWasherPayload | UpdateWasherPayload) => {
    if (!token || !editingWasher) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      // When editing, username is not included in UpdateWasherPayload
      const updatePayload: UpdateWasherPayload = {
        name: (payload as CreateWasherPayload).name || (payload as UpdateWasherPayload).name,
        surname: (payload as CreateWasherPayload).surname || (payload as UpdateWasherPayload).surname,
        contact: (payload as CreateWasherPayload).contact || (payload as UpdateWasherPayload).contact,
        salaryPercentage: (payload as CreateWasherPayload).salaryPercentage || (payload as UpdateWasherPayload).salaryPercentage,
      };
      await updateWasher(token, editingWasher.id, updatePayload);
      setSuccessMessage(t("admin.washers.updateSuccess"));
      setEditingWasher(null);
      await refreshWashers();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleDeactivate = async (washer: Washer) => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      await updateWasher(token, washer.id, { active: !washer.active });
      setSuccessMessage(washer.active ? t("admin.washers.deactivated") : t("admin.washers.activated"));
      await refreshWashers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.washers.updateFailed"));
    }
  };

  const handleDeleteClick = (washerId: number) => {
    setWasherToDelete(washerId);
    setMasterPinForAction("");
  };

  const handleDeleteConfirm = async () => {
    if (!token || !washerToDelete || !masterPinForAction) {
      return;
    }

    if (masterPinForAction.trim() !== MASTER_PIN) {
      setError(t("admin.incorrectPin"));
      setMasterPinForAction(null);
      setWasherToDelete(null);
      return;
    }

    try {
      await deleteWasher(token, washerToDelete, masterPinForAction.trim());
      setSuccessMessage(t("admin.washers.deleteSuccess"));
      setMasterPinForAction(null);
      setWasherToDelete(null);
      await refreshWashers();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.washers.deleteFailed"));
      setMasterPinForAction(null);
      setWasherToDelete(null);
    }
  };

  const getWasherDisplayName = (washer: Washer): string => {
    const parts = [washer.name, washer.surname].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : washer.username;
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
              {t("admin.washers.pageTitle")}
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => {
                setEditingWasher(null);
                setShowAddModal(true);
              }}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              {t("admin.washers.addWasher")}
            </Button>
          </View>

          {/* Washers List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyLarge">{t("admin.washers.loading")}</Text>
            </View>
          ) : washers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t("admin.washers.noWashers")}
              </Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {washers.map((washer) => (
                <View
                  key={washer.id}
                  style={[
                    styles.washerItem,
                    !washer.active && styles.washerItemInactive,
                  ]}
                >
                  <View style={styles.washerInfo}>
                    <View style={styles.washerNameRow}>
                      <Text variant="bodyLarge" style={styles.washerName}>
                        {getWasherDisplayName(washer)}
                      </Text>
                      {!washer.active && (
                        <Chip mode="outlined" compact style={styles.inactiveChip}>
                          {t("admin.washers.inactive")}
                        </Chip>
                      )}
                    </View>
                    <Text variant="bodySmall" style={styles.washerDetails}>
                      @{washer.username}
                      {washer.contact && ` • ${washer.contact}`}
                      {washer.salaryPercentage > 0 && ` • ${washer.salaryPercentage}% salary`}
                    </Text>
                  </View>
                  <View style={styles.washerActions}>
                    <IconButton
                      icon={washer.active ? "pause" : "play"}
                      size={20}
                      iconColor={washer.active ? "#FF9800" : "#4CAF50"}
                      onPress={() => handleDeactivate(washer)}
                    />
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#2196F3"
                      onPress={() => {
                        setEditingWasher(washer);
                        setShowAddModal(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDeleteClick(washer.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <WasherFormModal
        visible={showAddModal}
        onDismiss={() => {
          setShowAddModal(false);
          setEditingWasher(null);
        }}
        onSave={editingWasher ? handleEditWasher : handleAddWasher}
        editingWasher={editingWasher}
      />

      <MasterPinModal
        visible={washerToDelete !== null}
        onDismiss={() => {
          setWasherToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setMasterPinForAction(pin);
          handleDeleteConfirm();
        }}
        title={t("admin.washers.deleteTitle")}
        description={t("admin.washers.deleteDescription")}
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
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
  },
  addButton: {
    backgroundColor: "#2F80ED",
  },
  addButtonLabel: {
    color: "#FFFFFF",
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
  listContainer: {
    gap: 8,
  },
  washerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 8,
  },
  washerItemInactive: {
    opacity: 0.6,
    backgroundColor: "#F5F5F5",
  },
  washerInfo: {
    flex: 1,
    marginRight: 8,
  },
  washerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  washerName: {
    fontWeight: "500",
    flex: 1,
  },
  inactiveChip: {
    height: 24,
  },
  washerDetails: {
    color: "#757575",
  },
  washerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  snackbar: {
    marginBottom: 16,
  },
});

