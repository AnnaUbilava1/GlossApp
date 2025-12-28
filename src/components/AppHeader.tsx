import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, Button, useTheme } from "react-native-paper";
import { router } from "expo-router";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

interface AppHeaderProps {
  user?: {
    name?: string;
    role?: string;
  };
  showAdminButton?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({
  user,
  showAdminButton = false,
  onLogout,
}: AppHeaderProps) {
  const theme = useTheme();
  const userName = user?.name || "John Doe";
  const userRole = user?.role || "staff";

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
            Car Wash Manager
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {userName} • {userRole}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {showAdminButton && (
          <Button
            mode="text"
            icon="cog"
            onPress={() => router.push("/(admin)")}
            labelStyle={styles.buttonLabel}
            style={styles.adminButton}
          >
            Admin
          </Button>
        )}
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
  adminButton: {
    marginRight: 4,
  },
  logoutButton: {},
  buttonLabel: {
    fontSize: 14,
    color: "#424242",
  },
});

