import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

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
  const auth = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const userName =
    user?.name || auth.user?.name || auth.user?.email || "Admin";

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
      auth.logout();
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
            {t("admin.panelTitle")}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {userName} • {t("admin.administrator")}
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
        <Button
          mode="text"
          icon="arrow-left"
          onPress={handleBack}
          labelStyle={styles.buttonLabel}
          style={styles.backButton}
        >
          {t("admin.main")}
        </Button>
        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          labelStyle={styles.buttonLabel}
          style={styles.logoutButton}
        >
          {t("admin.logout")}
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
  backButton: {
    marginRight: 4,
  },
  logoutButton: {},
  buttonLabel: {
    fontSize: 14,
    color: "#424242",
  },
});

