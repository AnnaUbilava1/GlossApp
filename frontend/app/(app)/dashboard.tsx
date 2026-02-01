import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
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
import { getStatusColor } from "../../src/utils/constants";
import { MASTER_PIN } from "../../src/utils/constants";
import { formatDateTime } from "../../src/utils/dateFormat";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function DashboardScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const [activeTab, setActiveTab] = React.useState("all-records");
  const {
    records,
    loading,
    error,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    summary,
    refresh,
  } = useDashboard(auth.token);

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
      // Refresh by nudging date state (triggering useDashboard effect)
      setStartDate((d) => d);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to finish record. Please try again.";
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
      setActionSuccess(`Record marked as paid (${paymentMethod})`);
      setStartDate((d) => d);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to mark record as paid. Please try again.";
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

  const handleDeleteConfirm = async () => {
    if (!auth.token || !recordToDelete || !masterPinForAction) {
      return;
    }

    if (masterPinForAction.trim() !== MASTER_PIN) {
      setActionError("Incorrect PIN");
      setMasterPinForAction(null);
      setRecordToDelete(null);
      return;
    }

    setActionError(null);
    try {
      await apiFetch(`/api/records/${recordToDelete}`, {
        token: auth.token,
        method: "DELETE",
        body: JSON.stringify({ masterPin: masterPinForAction.trim() }),
      });
      setActionSuccess("Record deleted successfully");
      setMasterPinForAction(null);
      setRecordToDelete(null);
      // Refresh by nudging date state
      setStartDate((d) => d);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to delete record. Please try again.";
      setActionError(msg);
      setMasterPinForAction(null);
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
              { key: "new-record", label: "New Record" },
              { key: "all-records", label: "All Records", count: records.length },
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

          {/* Date range filter */}
          <View style={styles.dateFilterRow}>
            <View style={styles.dateField}>
              <Text variant="labelSmall" style={styles.dateLabel}>
                Start Date (YYYY-MM-DD)
              </Text>
              <TextInput
                mode="outlined"
                value={startDate}
                onChangeText={setStartDate}
                style={styles.dateInput}
              />
            </View>
            <View style={styles.dateField}>
              <Text variant="labelSmall" style={styles.dateLabel}>
                End Date (YYYY-MM-DD)
              </Text>
              <TextInput
                mode="outlined"
                value={endDate}
                onChangeText={setEndDate}
                style={styles.dateInput}
              />
            </View>
          </View>

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={[styles.headerCell, styles.licenseCell]}>License Number</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.carTypeCell]}>Car Type</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.companyCell]}>Company & Discount</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.serviceCell]}>Service</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.priceCell]}>Original Price</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.priceCell]}>Price</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.priceCell]}>Washer Cut</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.boxCell]}>Box</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.washerCell]}>Washer</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.timeCell]}>Start Time</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.timeCell]}>End Time</DataTable.Title>
                <DataTable.Title style={[styles.headerCell, styles.actionsCell]}>Actions</DataTable.Title>
              </DataTable.Header>

              {records.map((record) => renderRecordRow(record))}
            </DataTable>
          ) : (
            // Mobile view: Card-based layout
            <View style={styles.mobileContainer}>
              {records.map((record) => {
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
                        ${record.price.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.mobileCardBody}>
                      <Text variant="bodyMedium">{record.carType} • {record.serviceType}</Text>
                      <Text variant="bodySmall" style={styles.mobileDetails}>
                        Original: ${(record.originalPrice ?? 0).toFixed(2)} • Washer Cut: ${(record.washerCut ?? 0).toFixed(2)}
                      </Text>
                      <Text variant="bodySmall" style={styles.mobileDetails}>
                        Box {record.boxNumber} • {record.washerName}
                      </Text>
                      <Text variant="bodySmall" style={styles.mobileTime}>
                        Start: {formatDateTime(record.startTime)} | End: {formatDateTime(record.endTime)}
                      </Text>
                    </View>
                    <View style={styles.mobileActions}>
                      {/* Show buttons only if not both finished and paid */}
                      {!(record.isFinished && record.isPaid) && (
                        <>
                          {/* Finish button - visible to all users */}
                          <Button
                            mode="contained"
                            compact
                            onPress={() => handleFinish(record.id)}
                            style={record.isFinished ? styles.finishButtonDone : styles.finishButton}
                            disabled={record.isFinished}
                          >
                            {record.isFinished ? "Finished" : "Finish"}
                          </Button>
                          {/* Pay button - visible only to admin */}
                          {auth.user?.role === "admin" && (
                            <Button
                              mode="contained"
                              compact
                              onPress={() => handlePaymentClick(record.id)}
                              style={record.isPaid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid}
                              disabled={record.isPaid}
                            >
                              {record.isPaid ? "Paid" : "Pay"}
                            </Button>
                          )}
                        </>
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

          {/* Footer Summary */}
          <DashboardSummary
            records={records}
            cash={summary.cash}
            card={summary.card}
            total={summary.total}
          />
        </View>
      </ScrollView>

      <MasterPinModal
        visible={recordToEdit !== null}
        onDismiss={() => {
          setRecordToEdit(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => handleEditConfirm(pin)}
        title="Edit Record"
        description="Enter Master PIN to edit this record"
      />

      <MasterPinModal
        visible={recordToDelete !== null}
        onDismiss={() => {
          setRecordToDelete(null);
          setMasterPinForAction(null);
        }}
        onCorrectPin={(pin) => {
          setMasterPinForAction(pin);
          handleDeleteConfirm();
        }}
        title="Delete Record"
        description="Enter Master PIN to confirm deletion"
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
        title="Select Payment Method"
        description="Choose how the payment was made:"
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
  licenseCell: {
    flex: 1.2,
    minWidth: 100,
  },
  carTypeCell: {
    flex: 0.9,
    minWidth: 80,
  },
  companyCell: {
    flex: 1.5,
    minWidth: 140,
  },
  serviceCell: {
    flex: 1.1,
    minWidth: 100,
  },
  priceCell: {
    flex: 0.8,
    minWidth: 90,
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
    minWidth: 150,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 12,
  },
  priceText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
    gap: 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileLicense: {
    fontWeight: "bold",
  },
  mobilePrice: {
    fontSize: 18,
    fontWeight: "600",
  },
  mobileCardBody: {
    marginBottom: 12,
  },
  mobileDetails: {
    color: "#757575",
    marginTop: 4,
  },
  mobileTime: {
    color: "#757575",
    marginTop: 4,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
});

