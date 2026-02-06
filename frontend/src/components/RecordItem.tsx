import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, DataTable, IconButton, Text } from "react-native-paper";
import type { DashboardRecord } from "../hooks/useDashboard";
import { formatMoney, getStatusColor, getStatusLabel } from "../utils/constants";
import { formatDateTime } from "../utils/dateFormat";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

type Props = {
  record: DashboardRecord;
  onFinish: () => void;
  onPayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
  condensed?: boolean;
};

export default function RecordItem({
  record,
  onFinish,
  onPayment,
  onEdit,
  onDelete,
  condensed = false,
}: Props) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const isAdmin = user?.role === "admin";
  const bgColor = getStatusColor(record.isFinished, record.isPaid);
  const statusLabel = getStatusLabel(record.isFinished, record.isPaid);

  return (
    <DataTable.Row style={[styles.tableRow, { backgroundColor: bgColor }]}>
      <DataTable.Cell style={[styles.cell, styles.licenseCell]}>
        {record.licenseNumber}
      </DataTable.Cell>
      <DataTable.Cell style={[styles.cell, styles.carTypeCell]}>{record.carType}</DataTable.Cell>
      {!condensed && (
        <DataTable.Cell style={[styles.cell, styles.companyCell]} textStyle={styles.cellText}>
          {record.companyDiscount}
        </DataTable.Cell>
      )}
      <DataTable.Cell style={[styles.cell, styles.serviceCell]}>{record.serviceType}</DataTable.Cell>
      {!condensed && (
        <DataTable.Cell style={[styles.cell, styles.priceCell]}>
          <Text style={styles.priceText}>{formatMoney(record.originalPrice ?? 0)}</Text>
        </DataTable.Cell>
      )}
      <DataTable.Cell style={[styles.cell, styles.priceCell]}>
        <Text style={styles.priceText}>{formatMoney(record.price)}</Text>
      </DataTable.Cell>
      {!condensed && (
        <DataTable.Cell style={[styles.cell, styles.priceCell]}>
          <Text style={styles.priceText}>{formatMoney(record.washerCut ?? 0)}</Text>
        </DataTable.Cell>
      )}
      {!condensed && (
        <DataTable.Cell style={[styles.cell, styles.boxCell]}>{record.boxNumber}</DataTable.Cell>
      )}
      {!condensed && (
        <DataTable.Cell style={[styles.cell, styles.washerCell]}>{record.washerName}</DataTable.Cell>
      )}
      {!condensed && (
        <>
          <DataTable.Cell style={[styles.cell, styles.timeCell]}>
            {formatDateTime(record.startTime)}
          </DataTable.Cell>
          <DataTable.Cell style={[styles.cell, styles.timeCell]}>
            {formatDateTime(record.endTime)}
          </DataTable.Cell>
        </>
      )}
      <DataTable.Cell style={styles.actionsCell}>
        <View style={styles.actionsContainer}>
          {/* Fixed-width button area - always takes same space */}
          <View style={styles.buttonArea}>
            {/* Show buttons only if not both finished and paid */}
            {!(record.isFinished && record.isPaid) ? (
              <>
                {/* Finish button - visible to all users */}
                <Button
                  mode="contained"
                  compact
                  onPress={onFinish}
                  style={record.isFinished ? styles.finishButtonDone : styles.finishButton}
                  labelStyle={condensed ? styles.finishButtonLabelCondensed : styles.finishButtonLabel}
                  disabled={record.isFinished}
                >
                  {record.isFinished ? t("records.finished") : t("records.finish")}
                </Button>
                {isAdmin && (
                  <Button
                    mode="contained"
                    compact
                    onPress={onPayment}
                    style={record.isPaid ? styles.paymentButtonPaid : styles.paymentButtonUnpaid}
                    labelStyle={condensed ? styles.paymentButtonLabelCondensed : styles.paymentButtonLabel}
                    disabled={record.isPaid}
                  >
                    {record.isPaid ? t("records.paid") : t("records.pay")}
                  </Button>
                )}
              </>
            ) : null}
          </View>
          {/* Icons area - always in same position */}
          {isAdmin && (
            <View style={styles.iconsArea}>
              <IconButton
                icon="pencil"
                size={condensed ? 18 : 20}
                iconColor="#2F80ED"
                onPress={onEdit}
              />
              <IconButton
                icon="delete"
                size={condensed ? 18 : 20}
                iconColor="#D32F2F"
                onPress={onDelete}
              />
            </View>
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
  cellText: {
    fontSize: 12,
  },
  priceText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  actionsCell: {
    flex: 1.5,
    minWidth: 240, // Increased to accommodate buttons (160px) + icons (80px) = 240px
    maxWidth: 260, // Increased max width to fit all content
    justifyContent: "center",
    alignItems: "flex-start", // Align content to start for consistency
    paddingRight: 8, // Add padding to prevent clipping
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    minWidth: 240, // Increased minimum width to fit buttons + icons
  },
  buttonArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 160, // Fixed width: 90px (finish) + 4px (gap) + 66px (payment) = 160px
    maxWidth: 160,
    width: 160,
    flexShrink: 0,
  },
  iconsArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
    flexShrink: 0,
  },
  finishButton: {
    backgroundColor: "#FF9800",
    minWidth: 90,
    maxWidth: 90,
    width: 90,
  },
  finishButtonDone: {
    backgroundColor: "#4CAF50",
    minWidth: 90,
    maxWidth: 90,
    width: 90,
  },
  finishButtonLabel: {
    fontSize: 12,
  },
  finishButtonLabelCondensed: {
    fontSize: 10,
  },
  paymentButtonUnpaid: {
    backgroundColor: "#D32F2F", // Red when unpaid
    minWidth: 66,
    maxWidth: 66,
    width: 66,
  },
  paymentButtonPaid: {
    backgroundColor: "#2E7D32", // Green when paid
    minWidth: 66,
    maxWidth: 66,
    width: 66,
  },
  paymentButtonLabel: {
    fontSize: 12,
  },
  paymentButtonLabelCondensed: {
    fontSize: 10,
  },
});

