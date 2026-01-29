import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Button, DataTable, IconButton, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../src/components/AppHeader";
import TabNavigation from "../../src/components/TabNavigation";
import { useAuth } from "../../src/context/AuthContext";
import { apiFetch } from "../../src/utils/api";
import { getStatusColor, getStatusLabel } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

type RecordRow = {
  id: string;
  licenseNumber: string;
  carType: string;
  companyDiscount?: string;
  serviceType: string;
  price: number;
  boxNumber: number;
  washerName: string;
  startTime: string | Date;
  endTime?: string | Date | null;
  isFinished: boolean;
  isPaid: boolean;
};

export default function DashboardScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState("all-records");
  const [records, setRecords] = useState<RecordRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.token) {
      router.replace("/(auth)");
      return;
    }
    setLoading(true);
    setError(null);
    apiFetch<{ records: RecordRow[] }>("/api/records", { token: auth.token })
      .then((data) => {
        setRecords(data.records || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load records"))
      .finally(() => setLoading(false));
  }, [auth.token]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    if (key === "new-record") {
      router.push("/(app)/new-record");
    }
  };

  const handleFinish = (recordId: string) => {
    // TODO: Implement finish logic
    console.log("Finish record", recordId);
  };

  const handlePayment = (recordId: string) => {
    // TODO: Implement payment logic
    console.log("Payment for record", recordId);
  };

  const handleEdit = (recordId: string) => {
    // TODO: Implement edit logic with PIN check
    console.log("Edit record", recordId);
  };

  const handleDelete = (recordId: string) => {
    // TODO: Implement delete logic with PIN check
    console.log("Delete record", recordId);
  };

  const renderRecordRow = (record: RecordRow) => {
    const bgColor = getStatusColor(record.isFinished, record.isPaid);
    const statusLabel = getStatusLabel(record.isFinished, record.isPaid);

    return (
      <DataTable.Row
        key={record.id}
        style={[styles.tableRow, { backgroundColor: bgColor }]}
      >
        <DataTable.Cell style={styles.cell}>{record.licenseNumber}</DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{record.carType}</DataTable.Cell>
        <DataTable.Cell style={styles.cell} textStyle={styles.cellText}>
          {record.companyDiscount}
        </DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{record.serviceType}</DataTable.Cell>
        <DataTable.Cell style={styles.cell}>
          <Text style={styles.priceText}>${record.price.toFixed(2)}</Text>
        </DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{record.boxNumber}</DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{record.washerName}</DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{String(record.startTime)}</DataTable.Cell>
        <DataTable.Cell style={styles.cell}>{record.endTime ? String(record.endTime) : "—"}</DataTable.Cell>
        <DataTable.Cell style={styles.actionsCell}>
          <View style={styles.actionsContainer}>
            {!record.isFinished && (
              <Button
                mode="contained"
                compact
                onPress={() => handleFinish(record.id)}
                style={styles.finishButton}
                labelStyle={styles.finishButtonLabel}
              >
                Finish
              </Button>
            )}
            {record.isFinished && !record.isPaid && (
              <Button
                mode="contained"
                compact
                onPress={() => handlePayment(record.id)}
                style={styles.paymentButton}
                labelStyle={styles.paymentButtonLabel}
              >
                Pay
              </Button>
            )}
            <IconButton
              icon="pencil"
              size={20}
              iconColor="#2F80ED"
              onPress={() => handleEdit(record.id)}
            />
            <IconButton
              icon="delete"
              size={20}
              iconColor="#D32F2F"
              onPress={() => handleDelete(record.id)}
            />
          </View>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

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

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>License Number</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Car Type</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Company & Discount</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Service</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Price</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Box Number</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Washer</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Start Time</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>End Time</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Actions</DataTable.Title>
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
                        Box {record.boxNumber} • {record.washerName}
                      </Text>
                      <Text variant="bodySmall" style={styles.mobileTime}>
                        Start: {String(record.startTime)} | End: {record.endTime ? String(record.endTime) : "—"}
                      </Text>
                    </View>
                    <View style={styles.mobileActions}>
                      {!record.isFinished && (
                        <Button
                          mode="contained"
                          compact
                          onPress={() => handleFinish(record.id)}
                        >
                          Finish
                        </Button>
                      )}
                      {record.isFinished && !record.isPaid && (
                        <Button
                          mode="contained"
                          compact
                          onPress={() => handlePayment(record.id)}
                        >
                          Pay
                        </Button>
                      )}
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                        onPress={() => handleEdit(record.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDelete(record.id)}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Footer Summary */}
          <View style={styles.footer}>
            <Text variant="bodyMedium" style={styles.footerText}>
              Total Cash: $0.00 | Total Card: $0.00 | Total Revenue: ${records.reduce((sum, r) => sum + (r.isPaid ? r.price : 0), 0).toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
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
  cellText: {
    fontSize: 12,
  },
  priceText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  actionsCell: {
    flex: 1.5,
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  finishButton: {
    backgroundColor: "#FF9800",
  },
  finishButtonLabel: {
    fontSize: 12,
  },
  paymentButton: {
    backgroundColor: "#4CAF50",
  },
  paymentButtonLabel: {
    fontSize: 12,
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

