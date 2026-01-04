import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface AdminHeaderProps {
  user?: {
    name?: string;
  };
  onBack?: () => void;
  onLogout?: () => void;
}

export default function AdminHeader({
  user,
  onBack,
  onLogout,
}: AdminHeaderProps) {
  const theme = useTheme();
  const userName = user?.name || "John Doe";

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.replace("/(app)");
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      router.replace("/(auth)");
    }
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.leftSection}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>💧</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text variant="titleLarge" style={styles.title}>
            Admin Panel
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {userName} • Administrator
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Button
          mode="text"
          icon="arrow-left"
          onPress={handleBack}
          labelStyle={styles.buttonLabel}
          style={styles.backButton}
        >
          Main
        </Button>
        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          labelStyle={styles.buttonLabel}
          style={styles.logoutButton}
        >
          Logout
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: isTablet ? 24 : 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    color: "#FFFFFF",
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  subtitle: {
    color: "#757575",
    fontSize: 14,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backButton: {
    marginRight: 4,
  },
  logoutButton: {},
  buttonLabel: {
    fontSize: 14,
    color: "#424242",
  },
});

