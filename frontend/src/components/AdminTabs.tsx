import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const { width } = Dimensions.get("window");

interface AdminTab {
  key: string;
  label: string;
  icon: string;
}

interface AdminTabsProps {
  tabs: AdminTab[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function AdminTabs({
  tabs,
  activeTab,
  onTabChange,
}: AdminTabsProps) {
  const theme = useTheme();

  const getIconName = (iconName: string): string => {
    const icons: { [key: string]: string } = {
      vehicles: "car-multiple",
      companies: "office-building",
      discounts: "percent-outline",
      washers: "account-group",
      pricing: "currency-usd",
      appusers: "account-multiple",
    };
    return icons[iconName] || "help-circle";
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && {
                backgroundColor: "#E0E0E0",
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.primary,
              },
            ]}
            onPress={() => onTabChange(tab.key)}
          >
            <MaterialCommunityIcons
              name={getIconName(tab.icon) as any}
              size={20}
              color={isActive ? theme.colors.primary : "#757575"}
            />
            <Text
              variant="bodyMedium"
              style={[
                styles.tabText,
                isActive && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 8,
  },
  tabText: {
    color: "#757575",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
});

