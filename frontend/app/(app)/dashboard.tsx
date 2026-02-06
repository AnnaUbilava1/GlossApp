import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View
} from "react-native";
import { Button, DataTable, IconButton, Text, TextInput, useTheme, Snackbar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../src/components/AppHeader";
import DashboardSummary from "../../src/components/DashboardSummary";
import RecordItem from "../../src/components/RecordItem";
import TabNavigation from "../../src/components/TabNavigation";
import MasterPinModal from "../../src/components/MasterPinModal";
import PaymentMethodModal from "../../src/components/PaymentMethodModal";
import { useAuth } from "../../src/context/AuthContext";
import { apiFetch } from "../../src/utils/api";
import { useDashboard } from "../../src/hooks/useDashboard";
import { useLanguage } from "../../src/context/LanguageContext";
import { formatMoney, getStatusColor, MASTER_PIN } from "../../src/utils/constants";
import { formatDateTime } from "../../src/utils/dateFormat";

type WasherOption = { id: number; username: string; name?: string | null; salaryPercentage?: number };

export default function DashboardScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const { t } = useLanguage();
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });
  
  // Standard responsive breakpoints
  const isMobile = screenDimensions.width < 600;
  const isMobileLandscape = isMobile && screenDimensions.width > screenDimensions.height;
  const isTablet = screenDimensions.width >= 600 && screenDimensions.width < 1024;
  const isMediumTablet = screenDimensions.width >= 600 && screenDimensions.width < 900; // Medium tablets for responsive styling
  const isDesktop = screenDimensions.width >= 1024;

  // Listen for screen dimension changes (including orientation)
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  // Generate styles based on screen size
  const styles = createStyles(isMobile, isMobileLandscape, isTablet, isMediumTablet, isDesktop);
  const [activeTab, setActiveTab] = React.useState("all-records");
  const {
    records,
    loading,
    error,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    refresh,
  } = useDashboard(auth.token);

  // Local filters for washer, payment method, and wash status
  const [washerFilter, setWasherFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "cash" | "card">("all");
  const [statusFilter, setStatusFilter] = useState<Set<"all" | "paid" | "unpaid" | "finished" | "unfinished">>(new Set(["all"]));

  // Active washers for washer dropdown filter
  const [washers, setWashers] = useState<WasherOption[]>([]);

  useEffect(() => {
    if (!auth.token) return;
    apiFetch<{ washers: WasherOption[] }>("/api/washers", { token: auth.token })
      .then((res) => {
        setWashers(res.washers || []);
      })
      .catch(() => {
        // Best-effort; dashboard still works without washer list
      });
  }, [auth.token]);

  const filteredRecords = useMemo(
    () =>
      records.filter((r) => {
        // Washer filter: exact match on washer username (washerName is username snapshot)
        if (washerFilter && r.washerName !== washerFilter) return false;

        if (paymentFilter !== "all") {
          if (!r.isPaid || r.paymentMethod !== paymentFilter) {
            return false;
          }
        }

        // Status filter: if "all" is selected, show everything
        if (statusFilter.has("all") || statusFilter.size === 0) {
          return true;
        }

        // Check payment status: if any payment filters are selected, record must match at least one
        const hasPaymentFilter = statusFilter.has("paid") || statusFilter.has("unpaid");
        const matchesPaymentFilter = !hasPaymentFilter || 
          (statusFilter.has("paid") && r.isPaid) || 
          (statusFilter.has("unpaid") && !r.isPaid);

        // Check finish status: if any finish filters are selected, record must match at least one
        const hasFinishFilter = statusFilter.has("finished") || statusFilter.has("unfinished");
        const matchesFinishFilter = !hasFinishFilter || 
          (statusFilter.has("finished") && r.isFinished) || 
          (statusFilter.has("unfinished") && !r.isFinished);

        // Record must match both payment and finish filters (AND logic across categories)
        return matchesPaymentFilter && matchesFinishFilter;
      }),
    [records, washerFilter, paymentFilter, statusFilter]
  );

  // Refetch records when screen gains focus (e.g. after adding a record)
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "new-record") {
      router.push("/(app)/new-record");
    }
  };

  const [actionError, setActionError] = React.useState<string | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(null);
  const [recordToEdit, setRecordToEdit] = useState<string | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);
  const [recordToPay, setRecordToPay] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleFinish = async (recordId: string) => {
    if (!auth.token) return;
    setActionError(null);
    try {
      await apiFetch(`/api/records/${recordId}/finish`, {
        token: auth.token,
        method: "POST",
      });
      refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("records.finishFailed");
      setActionError(msg);
    }
  };

  const handlePaymentClick = (recordId: string) => {
    setRecordToPay(recordId);
  };

  const handlePayment = async (recordId: string, paymentMethod: "cash" | "card") => {
    if (!auth.token) return;
    setActionError(null);
    try {
      await apiFetch(`/api/records/${recordId}/pay`, {
        token: auth.token,
        method: "POST",
        body: JSON.stringify({ paymentMethod }),
      });
      setActionSuccess(t("records.paidSuccess"));
      setRecordToPay(null);
      refresh();
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("records.payFailed");
      setActionError(msg);
    }
  };

  const handleEditClick = (recordId: string) => {
    setRecordToEdit(recordId);
    setMasterPinForAction("");
  };

  const handleDeleteClick = (recordId: string) => {
    setRecordToDelete(recordId);
    setMasterPinForAction("");
  };

  const handleEditConfirm = async (pin: string) => {
    if (!auth.token || !recordToEdit) return;
    const trimmed = (pin ?? masterPinForAction ?? "").trim();
    if (!trimmed) return;

    if (trimmed !== MASTER_PIN) {
      setActionError("Incorrect PIN");
      setMasterPinForAction(null);
      setRecordToEdit(null);
      return;
    }

    setMasterPinForAction(null);
    setRecordToEdit(null);
    router.push(`/(app)/edit-record/${recordToEdit}` as import("expo-router").Href);
  };

  const handleDeleteConfirm = async (pin: string) => {
    if (!auth.token || !recordToDelete) return;
    const trimmed = pin.trim();
    if (!trimmed || trimmed !== MASTER_PIN) {
      setActionError("Incorrect PIN");
      setRecordToDelete(null);
      return;
    }
    setActionError(null);
    try {
      await apiFetch(`/api/records/${recordToDelete}`, {
        token: auth.token,
        method: "DELETE",
        body: JSON.stringify({ masterPin: trimmed }),
      });
      setActionSuccess(t("records.deletedSuccess"));
      setMasterPinForAction(null);
      setRecordToDelete(null);
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("records.deleteFailed");
      setActionError(msg);
      setRecordToDelete(null);
    }
  };

  const renderRecordRow = (record: any) => (
    <RecordItem
      key={record.id}
      record={record}
      onFinish={() => handleFinish(record.id)}
      onPayment={() => handlePaymentClick(record.id)}
      onEdit={() => handleEditClick(record.id)}
      onDelete={() => handleDeleteClick(record.id)}
            />
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <TabNavigation
            tabs={[
              { key: "new-record", label: t("tabs.newRecord") },
              { key: "all-records", label: t("tabs.allRecords"), count: records.length },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          {!!error && (
            <Text variant="bodySmall" style={{ color: "#D32F2F", marginBottom: 8 }}>
              {error}
            </Text>
          )}
          {!!actionError && (
            <Text variant="bodySmall" style={{ color: "#D32F2F", marginBottom: 8 }}>
              {actionError}
            </Text>
          )}

          {!isMobile ? (
            isDesktop ? (
              <DataTable style={styles.table}>
                <DataTable.Header>
                  <DataTable.Title style={[styles.headerCell, styles.licenseCell]}>{t("records.licenseNumber")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.carTypeCell]}>{t("records.carType")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.companyCell]}>{t("records.companyDiscount")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.serviceCell]}>{t("records.service")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.originalPrice")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.price")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.washerCut")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.boxCell]}>{t("records.box")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.washerCell]}>{t("records.washer")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.timeCell]}>{t("records.startTime")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.timeCell]}>{t("records.endTime")}</DataTable.Title>
                  <DataTable.Title style={[styles.headerCell, styles.actionsCell]}>{t("records.actions")}</DataTable.Title>
                </DataTable.Header>

                {filteredRecords.map((record) => renderRecordRow(record))}
              </DataTable>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={isMobileLandscape || isMediumTablet || isTablet}
                style={styles.tableScrollView}
                contentContainerStyle={styles.tableScrollContent}
              >
                <DataTable style={styles.table}>
                  <DataTable.Header>
                    <DataTable.Title style={[styles.headerCell, styles.licenseCell]}>{t("records.licenseNumber")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.carTypeCell]}>{t("records.carType")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.companyCell]}>{t("records.companyDiscount")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.serviceCell]}>{t("records.service")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.originalPrice")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.price")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.priceCell]}>{t("records.washerCut")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.boxCell]}>{t("records.box")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.washerCell]}>{t("records.washer")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.timeCell]}>{t("records.startTime")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.timeCell]}>{t("records.endTime")}</DataTable.Title>
                    <DataTable.Title style={[styles.headerCell, styles.actionsCell]}>{t("records.actions")}</DataTable.Title>
                  </DataTable.Header>

                  {filteredRecords.map((record) => renderRecordRow(record))}
                </DataTable>
              </ScrollView>
            )
          ) : (
            // Mobile view: Card-based layout
            <View style={styles.mobileContainer}>
              {filteredRecords.map((record) => {
                const bgColor = getStatusColor(record.isFinished, record.isPaid);
                return (
                  <View
                    key={record.id}
                    style={[styles.mobileCard, { backgroundColor: bgColor }]}
                  >
                    <View style={styles.mobileCardHeader}>
                      <Text variant="titleMedium" style={styles.mobileLicense}>
                        {record.licenseNumber}
                      </Text>
                      <Text style={[styles.mobilePrice, { color: "#2F80ED" }]}>
                        {formatMoney(record.price)}
                      </Text>
                    </View>
                    <View style={styles.mobileCardBody}>
                      <Text variant="bodyMedium">{record.carType} | {record.serviceType}</Text>
                      <Text variant="bodySmall" style={styles.mobileDetails}>
                        {t("records.originalPrice")}: {formatMoney(record.originalPrice ?? 0)} | {t("records.washerCut")}: {formatMoney(record.washerCut ?? 0)}
                      </Text>
                      <Text variant="bodySmall" style={styles.mobileDetails}>
                        {t("records.boxLabel")} {record.boxNumber} | {record.washerName}
                      </Text>
                      <Text variant="bodySmall" style={styles.mobileTime}>
                        {t("records.start")}: {formatDateTime(record.startTime)} | {t("records.end")}: {formatDateTime(record.endTime)}
                      </Text>
                        </View>
                    <View style={styles.mobileActions}>
                      {/* Show buttons only if not both finished and paid */}
                      {!(record.isFinished && record.isPaid) ? (
                        <>
                          {/* Finish button - visible to all users */}
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleFinish(record.id)}
                            style={[record.isFinished ? styles.finishButtonDone : styles.finishButton, isMobile && styles.mobileButton]}
                            labelStyle={isMobile ? styles.mobileButtonLabel : undefined}
                            disabled={record.isFinished}
                          >
                            {record.isFinished ? t("records.finished") : t("records.finish")}
                          </Button>
                          {auth.user?.role === "admin" && (
                            <Button
                              mode="contained"
                              compact
                              onPress={() => handlePaymentClick(record.id)}
                              style={[record.isPaid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid, isMobile && styles.mobileButton]}
                              labelStyle={isMobile ? styles.mobileButtonLabel : undefined}
                              disabled={record.isPaid}
                            >
                              {record.isPaid ? t("records.paid") : t("records.pay")}
                            </Button>
                          )}
                        </>
                      ) : (
                        // Empty spacer to maintain layout consistency
                        <View style={styles.mobileButtonSpacer} />
                      )}
                      {auth.user?.role === "admin" && (
                        <>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                            onPress={() => handleEditClick(record.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                            onPress={() => handleDeleteClick(record.id)}
                      />
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky bottom summary & filters */}
      <DashboardSummary
        records={filteredRecords}
        washers={washers}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        washerFilter={washerFilter}
        setWasherFilter={setWasherFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      <MasterPinModal
        visible={recordToEdit !== null}
        onDismiss={() => {
          setRecordToEdit(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => handleEditConfirm(pin)}
        title={t("records.editRecord")}
        description={t("records.editRecordDescription")}
      />

      <MasterPinModal
        visible={recordToDelete !== null}
        onDismiss={() => {
          setRecordToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setRecordToDelete(null);
          handleDeleteConfirm(pin);
        }}
        title={t("records.deleteRecord")}
        description={t("records.deleteRecordDescription")}
      />

      <PaymentMethodModal
        visible={recordToPay !== null}
        onDismiss={() => {
          setRecordToPay(null);
        }}
        onSelect={(method) => {
          if (recordToPay) {
            handlePayment(recordToPay, method);
            setRecordToPay(null);
          }
        }}
        title={t("records.selectPaymentMethod")}
        description={t("records.choosePaymentMethod")}
      />

      <Snackbar
        visible={!!actionError}
        onDismiss={() => setActionError(null)}
        duration={4000}
        style={styles.snackbar}
      >
        {actionError}
      </Snackbar>

      <Snackbar
        visible={!!actionSuccess}
        onDismiss={() => setActionSuccess(null)}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: theme.colors.primaryContainer }]}
      >
        {actionSuccess}
      </Snackbar>
    </SafeAreaView>
  );
}

const createStyles = (isMobile: boolean, isMobileLandscape: boolean, isTablet: boolean, isMediumTablet: boolean, isDesktop: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isMobileLandscape ? 8 : isMobile ? 4 : isTablet ? 12 : 24,
    paddingHorizontal: isMobileLandscape ? 16 : undefined,
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
  dateFilterRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    marginBottom: 4,
    color: "#757575",
  },
  dateInput: {
    backgroundColor: "#FAFAFA",
  },
  tableScrollView: {
    flexGrow: 0,
  },
  tableScrollContent: {
    flexGrow: 0,
  },
  table: {
    backgroundColor: "transparent",
    width: isDesktop ? "100%" : undefined,
    minWidth: isDesktop ? undefined : isMediumTablet ? 600 : isMobileLandscape ? 800 : undefined,
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1,
  },
  headerText: {
    fontSize: isMediumTablet ? 11 : isMobileLandscape ? 11 : 12,
  },
  cell: {
    flex: 1,
  },
  licenseCell: {
    flex: 1.2,
    minWidth: isMediumTablet ? 90 : isMobileLandscape ? 100 : 100,
  },
  carTypeCell: {
    flex: 0.9,
    minWidth: isMediumTablet ? 70 : isMobileLandscape ? 75 : 80,
  },
  companyCell: {
    flex: 1.5,
    minWidth: 140,
  },
  serviceCell: {
    flex: 1.1,
    minWidth: isMediumTablet ? 90 : isMobileLandscape ? 95 : 100,
  },
  priceCell: {
    flex: 0.8,
    minWidth: isMediumTablet ? 80 : isMobileLandscape ? 85 : 90,
  },
  boxCell: {
    flex: 0.5,
    minWidth: 50,
  },
  washerCell: {
    flex: 1,
    minWidth: 80,
  },
  timeCell: {
    flex: 1.3,
    minWidth: 120,
  },
  actionsCell: {
    flex: 1.5,
    minWidth: isMediumTablet ? 140 : isMobileLandscape ? 145 : 150,
    maxWidth: isMediumTablet ? 180 : isMobileLandscape ? 190 : 200, // Prevent excessive spreading
    justifyContent: "center",
    alignItems: "flex-start", // Align content consistently
  },
  cellText: {
    fontSize: isMediumTablet ? 11 : isMobileLandscape ? 11 : 12,
  },
  priceText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    width: "100%",
    minWidth: isMediumTablet ? 140 : isMobileLandscape ? 145 : 150, // Maintain minimum width
  },
  finishButton: {
    backgroundColor: "#FF9800",
  },
  finishButtonDone: {
    backgroundColor: "#4CAF50",
  },
  finishButtonLabel: {
    fontSize: 12,
  },
  paymentButtonUnpaid: {
    backgroundColor: "#D32F2F", // Red when unpaid
  },
  paymentButtonPaid: {
    backgroundColor: "#2E7D32", // Green when paid
  },
  paymentButtonLabel: {
    fontSize: 12,
  },
  snackbar: {
    marginBottom: 16,
  },
  mobileContainer: {
    gap: isMobile ? 0 : 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: isMobile ? 10 : 14,
    marginBottom: isMobile ? 8 : 12,
    minHeight: isMobile ? 120 : undefined,
    overflow: "visible",
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isMobile ? 8 : 6,
    flexWrap: "wrap",
    gap: 8,
  },
  mobileLicense: {
    fontWeight: "bold",
    fontSize: isMobile ? 15 : undefined,
  },
  mobilePrice: {
    fontSize: isMobile ? 14 : 16,
    fontWeight: "600",
  },
  mobileCardBody: {
    marginBottom: isMobile ? 0 : 8,
    flexWrap: "wrap",
    paddingBottom: isMobile ? 0 : 0,
  },
  mobileDetails: {
    color: "#757575",
    marginTop: isMobile ? 4 : 2,
    fontSize: isMobile ? 11 : undefined,
    lineHeight: isMobile ? 20 : undefined,
  },
  mobileTime: {
    color: "#757575",
    marginTop: isMobile ? 4 : 2,
    fontSize: isMobile ? 11 : undefined,
    lineHeight: isMobile ? 20 : undefined,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: isMobile ? 4 : 8,
    flexWrap: "wrap",
    marginVertical: 0
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  footerText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#424242",
  },
  mobileButton: {
    minWidth: isMobile ? 70 : undefined,
    paddingHorizontal: isMobile ? 8 : undefined,
  },
  mobileButtonLabel: {
    fontSize: 11,
  },
  mobileButtonSpacer: {
    width: isMobile ? 140 : 160, // Approximate width of buttons to maintain layout
    minWidth: isMobile ? 140 : 160,
  },
});

