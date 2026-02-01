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
  IconButton,
  Text,
  TextInput,
  useTheme,
  Snackbar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import VehicleFormModal from "../../src/components/VehicleFormModal";
import MasterPinModal from "../../src/components/MasterPinModal";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  getAllVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
  type CreateVehiclePayload,
  type UpdateVehiclePayload,
} from "../../src/services/vehicleService";
import { MASTER_PIN } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function VehiclesScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("vehicles");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch vehicles on mount and when search/page changes
  useEffect(() => {
    if (!token) return;

    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getAllVehicles(token, searchQuery || undefined, page, 50);
        setVehicles(response.vehicles);
        setTotalPages(response.pagination.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.vehicles.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [token, searchQuery, page]);

  const refreshVehicles = async () => {
    if (!token) return;
    try {
      const response = await getAllVehicles(token, searchQuery || undefined, page, 50);
      setVehicles(response.vehicles);
      setTotalPages(response.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.vehicles.loadFailed"));
    }
  };

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      // Already here
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
    }
  };

  const handleAddVehicle = async (payload: CreateVehiclePayload | UpdateVehiclePayload) => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      const createPayload: CreateVehiclePayload = {
        licensePlate: (payload as CreateVehiclePayload).licensePlate || (payload as UpdateVehiclePayload).licensePlate || "",
        carType: (payload as CreateVehiclePayload).carType || (payload as UpdateVehiclePayload).carType || "Sedan",
      };
      await createVehicle(token, createPayload);
      setSuccessMessage(t("admin.vehicles.addSuccess"));
      await refreshVehicles();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleEditVehicle = async (payload: CreateVehiclePayload | UpdateVehiclePayload) => {
    if (!token || !editingVehicle) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      const updatePayload: UpdateVehiclePayload = {
        licensePlate: (payload as CreateVehiclePayload).licensePlate || (payload as UpdateVehiclePayload).licensePlate,
        carType: (payload as CreateVehiclePayload).carType || (payload as UpdateVehiclePayload).carType,
      };
      await updateVehicle(token, editingVehicle.id, updatePayload);
      setSuccessMessage(t("admin.vehicles.updateSuccess"));
      setEditingVehicle(null);
      await refreshVehicles();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleDeleteClick = (vehicleId: string) => {
    setVehicleToDelete(vehicleId);
    setMasterPinForAction("");
  };

  const handleDeleteConfirm = async () => {
    if (!token || !vehicleToDelete || !masterPinForAction) {
      return;
    }

    if (masterPinForAction.trim() !== MASTER_PIN) {
      setError(t("admin.incorrectPin"));
      setMasterPinForAction(null);
      setVehicleToDelete(null);
      return;
    }

    try {
      await deleteVehicle(token, vehicleToDelete, masterPinForAction.trim());
      setSuccessMessage(t("admin.vehicles.deleteSuccess"));
      setMasterPinForAction(null);
      setVehicleToDelete(null);
      await refreshVehicles();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.vehicles.deleteFailed"));
      setMasterPinForAction(null);
      setVehicleToDelete(null);
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
              { key: "pricing", label: t("admin.pricing"), icon: "pricing" },
              { key: "appusers", label: t("admin.appUsers"), icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <View style={styles.headerRow}>
            <Text variant="titleLarge" style={styles.title}>
              {t("admin.vehicles.pageTitle")}
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => {
                setEditingVehicle(null);
                setShowAddModal(true);
              }}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              {t("admin.vehicles.addVehicle")}
            </Button>
          </View>

          <TextInput
            mode="outlined"
            label={t("admin.vehicles.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            left={<TextInput.Icon icon="magnify" />}
            right={
              searchQuery ? (
                <TextInput.Icon icon="close" onPress={() => setSearchQuery("")} />
              ) : undefined
            }
          />

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyLarge">{t("admin.vehicles.loading")}</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t("admin.vehicles.noVehicles")}
              </Text>
            </View>
          ) : isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>{t("newRecord.licensePlate")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("newRecord.carCategory")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.actions")}</DataTable.Title>
              </DataTable.Header>

              {vehicles.map((vehicle) => (
                <DataTable.Row key={vehicle.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{vehicle.licensePlate}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{vehicle.carCategory}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                        onPress={() => {
                          setEditingVehicle(vehicle);
                          setShowAddModal(true);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDeleteClick(vehicle.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{vehicle.licensePlate}</Text>
                    <Text variant="bodyMedium" style={styles.carTypeText}>
                      {vehicle.carCategory}
                    </Text>
                  </View>
                  <View style={styles.mobileActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#2F80ED"
                      onPress={() => {
                        setEditingVehicle(vehicle);
                        setShowAddModal(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDeleteClick(vehicle.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {totalPages > 1 && (
            <View style={styles.paginationContainer}>
              <Button
                disabled={page === 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                mode="outlined"
              >
                {t("admin.pagination.previous")}
              </Button>
              <Text variant="bodyMedium" style={styles.paginationText}>
                {page} / {totalPages}
              </Text>
              <Button
                disabled={page >= totalPages}
                onPress={() => setPage((p) => Math.min(totalPages, p + 1))}
                mode="outlined"
              >
                {t("admin.pagination.next")}
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      <VehicleFormModal
        visible={showAddModal}
        onDismiss={() => {
          setShowAddModal(false);
          setEditingVehicle(null);
        }}
        onSave={editingVehicle ? handleEditVehicle : handleAddVehicle}
        editingVehicle={editingVehicle}
      />

      <MasterPinModal
        visible={vehicleToDelete !== null}
        onDismiss={() => {
          setVehicleToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setMasterPinForAction(pin);
          handleDeleteConfirm();
        }}
        title={t("admin.vehicles.deleteTitle")}
        description={t("admin.vehicles.deleteDescription")}
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
  },
  addButton: {
    backgroundColor: "#2F80ED",
  },
  addButtonLabel: {
    color: "#FFFFFF",
  },
  searchInput: {
    marginBottom: 16,
    backgroundColor: "#FAFAFA",
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
  table: {
    backgroundColor: "transparent",
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  actionsCell: {
    flex: 0.8,
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 16,
  },
  paginationText: {
    color: "#757575",
  },
  mobileContainer: {
    gap: 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  carTypeText: {
    color: "#757575",
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  snackbar: {
    marginBottom: 16,
  },
});

