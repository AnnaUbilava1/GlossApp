import React from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
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

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: string } = {
      customers: "👥",
      vehicles: "🚗",
      companies: "🏢",
      discounts: "%",
    };
    return icons[iconName] || "";
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
            <Text style={styles.icon}>{getIcon(tab.icon)}</Text>
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
  icon: {
    fontSize: 18,
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

