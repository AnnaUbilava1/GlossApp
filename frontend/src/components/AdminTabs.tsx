import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

const { width } = Dimensions.get("window");
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;

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
      types: "tune-variant",
      appusers: "account-multiple",
    };
    return icons[iconName] || "help-circle";
  };

  const TabContent = (
    <View style={[styles.container, isMobile && styles.containerMobile]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isMobile && styles.tabMobile,
              isTablet && styles.tabTablet,
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
              size={isMobile ? 18 : 20}
              color={isActive ? theme.colors.primary : "#757575"}
            />
            <Text
              variant={isMobile ? "bodySmall" : isTablet ? "bodySmall" : "bodyMedium"}
              style={[
                styles.tabText,
                isActive && styles.activeTabText,
                isMobile && styles.tabTextMobile,
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // On mobile, wrap in ScrollView for horizontal scrolling
  if (isMobile) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {TabContent}
      </ScrollView>
    );
  }

  return TabContent;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 4,
  },
  container: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 4,
    borderRadius: 8,
    marginBottom: 16,
    minWidth: "100%",
  },
  containerMobile: {
    minWidth: Math.max(width - 32, 500),
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
    minWidth: 80,
  },
  tabMobile: {
    flex: 0,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 90,
  },
  tabTablet: {
    paddingHorizontal: 10,
  },
  tabText: {
    color: "#757575",
    fontWeight: "500",
  },
  tabTextMobile: {
    fontSize: 11,
  },
  activeTabText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
});

