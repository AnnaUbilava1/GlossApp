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
  useTheme,
  Snackbar,
  Chip,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import CompanyFormModal from "../../src/components/CompanyFormModal";
import MasterPinModal from "../../src/components/MasterPinModal";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import {
  getAllCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  type Company,
  type CreateCompanyPayload,
  type UpdateCompanyPayload,
} from "../../src/services/companyService";
import { MASTER_PIN } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;
const isDesktop = width >= 1024;

export default function CompaniesScreen() {
  const theme = useTheme();
  const { token, user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("companies");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  // Fetch companies on mount and when token changes
  useEffect(() => {
    if (!token) return;

    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        const allCompanies = await getAllCompanies(token);
        setCompanies(allCompanies);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("admin.companies.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [token]);

  const refreshCompanies = async () => {
    if (!token) return;
    try {
      const allCompanies = await getAllCompanies(token);
      setCompanies(allCompanies);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.companies.loadFailed"));
    }
  };

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      // Already here
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handleAddCompany = async (payload: CreateCompanyPayload | UpdateCompanyPayload) => {
    if (!token) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      // Convert to CreateCompanyPayload (name and contact are required)
      const createPayload: CreateCompanyPayload = {
        name: (payload as CreateCompanyPayload).name || (payload as UpdateCompanyPayload).name || "",
        contact: (payload as CreateCompanyPayload).contact || (payload as UpdateCompanyPayload).contact || "",
        discountPercentages: (payload as CreateCompanyPayload).discountPercentages || (payload as UpdateCompanyPayload).discountPercentages,
      };
      await createCompany(token, createPayload);
      setSuccessMessage(t("admin.companies.addSuccess"));
      await refreshCompanies();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleEditCompany = async (payload: CreateCompanyPayload | UpdateCompanyPayload) => {
    if (!token || !editingCompany) {
      setError(t("admin.notAuthenticated"));
      return;
    }

    try {
      // Convert to UpdateCompanyPayload (all fields optional)
      const updatePayload: UpdateCompanyPayload = {
        name: (payload as CreateCompanyPayload).name || (payload as UpdateCompanyPayload).name,
        contact: (payload as CreateCompanyPayload).contact || (payload as UpdateCompanyPayload).contact,
        discountPercentages: (payload as CreateCompanyPayload).discountPercentages || (payload as UpdateCompanyPayload).discountPercentages,
      };
      await updateCompany(token, editingCompany.id, updatePayload);
      setSuccessMessage(t("admin.companies.updateSuccess"));
      setEditingCompany(null);
      await refreshCompanies();
    } catch (err) {
      throw err; // Re-throw to let modal handle it
    }
  };

  const handleDeleteClick = (companyId: string) => {
    setCompanyToDelete(companyId);
    setMasterPinForAction("");
  };

  const handleDeleteConfirm = async (pin: string) => {
    if (!token || !companyToDelete) return;
    const trimmed = pin.trim();
    if (!trimmed || trimmed !== MASTER_PIN) {
      setError(t("admin.incorrectPin"));
      setCompanyToDelete(null);
      return;
    }
    try {
      await deleteCompany(token, companyToDelete, trimmed);
      setSuccessMessage(t("admin.companies.deleteSuccess"));
      setMasterPinForAction(null);
      setCompanyToDelete(null);
      await refreshCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.companies.deleteFailed"));
      setCompanyToDelete(null);
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
              {t("admin.companies.pageTitle")}
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => {
                setEditingCompany(null);
                setShowAddModal(true);
              }}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              {t("admin.companies.addCompany")}
            </Button>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <Text variant="bodyLarge">{t("admin.companies.loading")}</Text>
            </View>
          ) : companies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                {t("admin.companies.noCompanies")}
              </Text>
            </View>
          ) : isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>{t("admin.companies.companyName")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.companies.contact")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.companies.discounts")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.actions")}</DataTable.Title>
              </DataTable.Header>

              {companies.map((company) => (
                <DataTable.Row key={company.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{company.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text variant="bodySmall">{company.contact}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    {company.discounts.length > 0 ? (
                      <View style={styles.discountChips}>
                        {company.discounts.map((discount) => (
                          <Chip key={discount.id} compact style={styles.discountChip}>
                            {discount.percentage}%
                          </Chip>
                        ))}
                      </View>
                    ) : (
                      <Text variant="bodySmall" style={styles.noDiscounts}>
                        {t("admin.companies.noDiscounts")}
                      </Text>
                    )}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                        onPress={() => {
                          setEditingCompany(company);
                          setShowAddModal(true);
                        }}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDeleteClick(company.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {companies.map((company) => (
                <View key={company.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{company.name}</Text>
                    {company.discounts.length > 0 && (
                      <View style={styles.mobileDiscounts}>
                        {company.discounts.map((discount) => (
                          <Chip key={discount.id} compact style={styles.discountChip}>
                            {discount.percentage}%
                          </Chip>
                        ))}
                      </View>
                    )}
                  </View>
                  <Text variant="bodyMedium" style={styles.mobileDetails}>
                    {company.contact}
                  </Text>
                  {company.discounts.length === 0 && (
                    <Text variant="bodySmall" style={styles.noDiscounts}>
                      {t("admin.companies.noDiscountsConfigured")}
                    </Text>
                  )}
                  <View style={styles.mobileActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#2F80ED"
                      onPress={() => {
                        setEditingCompany(company);
                        setShowAddModal(true);
                      }}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDeleteClick(company.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <CompanyFormModal
        visible={showAddModal}
        onDismiss={() => {
          setShowAddModal(false);
          setEditingCompany(null);
        }}
        onSave={async (payload) => {
          if (editingCompany) {
            await handleEditCompany(payload);
          } else {
            await handleAddCompany(payload);
          }
        }}
        editingCompany={editingCompany}
      />

      <MasterPinModal
        visible={companyToDelete !== null}
        onDismiss={() => {
          setCompanyToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setCompanyToDelete(null);
          handleDeleteConfirm(pin);
        }}
        title={t("admin.companies.deleteTitle")}
        description={t("admin.companies.deleteDescription")}
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
    padding: isMobile ? 12 : isTablet ? 20 : 24,
  },
  card: {
    borderRadius: 12,
    padding: isMobile ? 16 : isTablet ? 24 : 32,
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
    flexDirection: isMobile ? "column" : "row",
    justifyContent: "space-between",
    alignItems: isMobile ? "flex-start" : "center",
    marginBottom: isMobile ? 16 : 24,
    gap: isMobile ? 12 : 0,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  addButton: {
    backgroundColor: "#2F80ED",
    width: isMobile ? "100%" : "auto",
  },
  addButtonLabel: {
    color: "#FFFFFF",
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
  discountText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  discountChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  discountChip: {
  },
  noDiscounts: {
    color: "#9E9E9E",
    fontStyle: "italic",
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
  mobileContainer: {
    gap: 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: isMobile ? 12 : 16,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  mobileDiscounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: isMobile ? 4 : 0,
  },
  mobileDetails: {
    color: "#757575",
    marginTop: 4,
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

