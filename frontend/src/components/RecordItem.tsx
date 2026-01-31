import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, DataTable, IconButton, Text } from "react-native-paper";
import type { DashboardRecord } from "../hooks/useDashboard";
import { getStatusColor, getStatusLabel } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

type Props = {
  record: DashboardRecord;
  onFinish: () => void;
  onPayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export default function RecordItem({
  record,
  onFinish,
  onPayment,
  onEdit,
  onDelete,
}: Props) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const bgColor = getStatusColor(record.isFinished, record.isPaid);
  const statusLabel = getStatusLabel(record.isFinished, record.isPaid);

  return (
    <DataTable.Row style={[styles.tableRow, { backgroundColor: bgColor }]}>
      <DataTable.Cell style={styles.cell}>
        {record.licenseNumber}
      </DataTable.Cell>
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
      <DataTable.Cell style={styles.cell}>
        {String(record.startTime)}
      </DataTable.Cell>
      <DataTable.Cell style={styles.cell}>
        {record.endTime ? String(record.endTime) : "—"}
      </DataTable.Cell>
      <DataTable.Cell style={styles.actionsCell}>
        <View style={styles.actionsContainer}>
          {/* Show buttons only if not both finished and paid */}
          {!(record.isFinished && record.isPaid) && (
            <>
              {/* Finish button - visible to all users */}
              <Button
                mode="contained"
                compact
                onPress={onFinish}
                style={record.isFinished ? styles.finishButtonDone : styles.finishButton}
                labelStyle={styles.finishButtonLabel}
                disabled={record.isFinished}
              >
                {record.isFinished ? "Finished" : "Finish"}
              </Button>
              {/* Pay button - visible only to admin */}
              {isAdmin && (
                <Button
                  mode="contained"
                  compact
                  onPress={onPayment}
                  style={record.isPaid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid}
                  labelStyle={styles.paymentButtonLabel}
                  disabled={record.isPaid}
                >
                  {record.isPaid ? "Paid" : "Pay"}
                </Button>
              )}
            </>
          )}
          {isAdmin && (
            <>
              <IconButton
                icon="pencil"
                size={20}
                iconColor="#2F80ED"
                onPress={onEdit}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor="#D32F2F"
                onPress={onDelete}
              />
            </>
          )}
        </View>
      </DataTable.Cell>
    </DataTable.Row>
  );
}

const styles = StyleSheet.create({
  tableRow: {
    minHeight: 60,
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
});

