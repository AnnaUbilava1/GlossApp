import React from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import type { DashboardRecord } from "../hooks/useDashboard";
import { formatMoney } from "../utils/constants";

type Props = {
  records: DashboardRecord[];
  cash: number;
  card: number;
  total: number;
};

export default function DashboardSummary({
  cash,
  card,
  total,
}: Props) {
  return (
    <View style={styles.footer}>
      <Text variant="bodyMedium" style={styles.footerText}>
        Total Cash: {formatMoney(cash)} | Total Card: {formatMoney(card)} | Total
        Revenue: {formatMoney(total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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

