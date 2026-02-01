import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../context/LanguageContext";

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
  const { language, setLanguage, t } = useLanguage();
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
            {t("header.appName")}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {userName} • {userRole}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.langRow}>
          <Button
            mode={language === "ka" ? "contained-tonal" : "text"}
            compact
            onPress={() => setLanguage("ka")}
            labelStyle={styles.langLabel}
          >
            ქართ
          </Button>
          <Button
            mode={language === "en" ? "contained-tonal" : "text"}
            compact
            onPress={() => setLanguage("en")}
            labelStyle={styles.langLabel}
          >
            EN
          </Button>
        </View>
        {showAdminButton && (
          <Button
            mode="text"
            icon="cog"
            onPress={() => router.push("/(admin)")}
            labelStyle={styles.buttonLabel}
            style={styles.adminButton}
          >
            {t("header.admin")}
          </Button>
        )}
        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          labelStyle={styles.buttonLabel}
          style={styles.logoutButton}
        >
          {t("header.logout")}
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
  langRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  langLabel: {
    fontSize: 12,
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

