import React from "react";
import { Dimensions, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const { width } = Dimensions.get("window");

interface TabNavigationProps {
  tabs: { key: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export default function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const theme = useTheme();

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
                backgroundColor: theme.colors.surface,
                borderBottomWidth: 2,
                borderBottomColor: theme.colors.primary,
              },
            ]}
            onPress={() => onTabChange(tab.key)}
          >
            <Text
              variant="bodyLarge"
              style={[
                styles.tabText,
                isActive && styles.activeTabText,
              ]}
            >
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
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

