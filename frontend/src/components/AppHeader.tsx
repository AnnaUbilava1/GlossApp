import { router } from "expo-router";
import React from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import { Button, Text, useTheme } from "react-native-paper";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;
const isDesktop = width >= 1024;

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
          <Text 
            variant={isMobile ? "titleMedium" : "titleLarge"} 
            style={styles.title}
            numberOfLines={1}
          >
            {t("header.appName")}
          </Text>
          {!isMobile && (
            <Text variant="bodyMedium" style={styles.subtitle} numberOfLines={1}>
              {userName} • {userRole}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        <View style={styles.langRow}>
          <Button
            mode={language === "en" ? "contained" : "text"}
            compact
            onPress={() => setLanguage("en")}
            style={styles.langButton}
            contentStyle={styles.langButtonContent}
            labelStyle={styles.langButtonLabel}
            buttonColor={language === "en" ? "#2563EB" : "transparent"}
            textColor={language === "en" ? "#EFF6FF" : "#1D4ED8"}
          >
            ENG
          </Button>

          <View style={styles.langDivider} />

          <Button
            mode={language === "ka" ? "contained" : "text"}
            compact
            onPress={() => setLanguage("ka")}
            style={styles.langButton}
            contentStyle={styles.langButtonContent}
            labelStyle={styles.langButtonLabel}
            buttonColor={language === "ka" ? "#2563EB" : "transparent"}
            textColor={language === "ka" ? "#EFF6FF" : "#1D4ED8"}
          >
            ქარ
          </Button>
        </View>
        {showAdminButton && (
          <Button
            mode="text"
            icon="cog"
            onPress={() => router.push("/(admin)")}
            labelStyle={styles.buttonLabel}
            style={styles.adminButton}
            compact={isMobile}
          >
            {isMobile ? "" : t("header.admin")}
          </Button>
        )}
        <Button
          mode="text"
          icon="logout"
          onPress={handleLogout}
          labelStyle={styles.buttonLabel}
          style={styles.logoutButton}
          compact={isMobile}
        >
          {isMobile ? "" : t("header.logout")}
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
    paddingHorizontal: isMobile ? 12 : isTablet ? 20 : 24,
    paddingVertical: isMobile ? 12 : 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    minHeight: isMobile ? 56 : 64,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
    marginRight: isMobile ? 8 : 12,
  },
  logo: {
    width: isMobile ? 32 : 40,
    height: isMobile ? 32 : 40,
    borderRadius: isMobile ? 16 : 20,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: isMobile ? 8 : 12,
    flexShrink: 0,
  },
  logoText: {
    fontSize: isMobile ? 20 : 24,
    color: "#FFFFFF",
  },
  titleContainer: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
    fontSize: isMobile ? 16 : undefined,
  },
  subtitle: {
    color: "#757575",
    fontSize: isMobile ? 12 : 14,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: isMobile ? 4 : 8,
    flexShrink: 0,
  },
  langRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  langButton: {
    minWidth: isMobile ? 24 : 26,
    borderRadius: 8,
  },
  langButtonContent: {
    paddingHorizontal: isMobile ? 1 : 2,
  },
  langButtonLabel: {
    fontSize: isMobile ? 11 : 12,
    fontWeight: "500",
    marginVertical: isMobile ? 4 : 5,
  },
  langDivider: {
    width: 1,
    height: isMobile ? 16 : 18,
    backgroundColor: "rgba(37, 99, 235, 0.45)",
    marginHorizontal: isMobile ? 2 : 4,
    alignSelf: "center",
  },
  adminButton: {
    marginRight: isMobile ? 2 : 4,
    minWidth: isMobile ? 40 : undefined,
  },
  logoutButton: {
    minWidth: isMobile ? 40 : undefined,
  },
  buttonLabel: {
    fontSize: isMobile ? 12 : 14,
    color: "#424242",
  },
});

