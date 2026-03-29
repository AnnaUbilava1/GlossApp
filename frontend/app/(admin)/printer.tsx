import { router } from "expo-router";
import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

const { width } = Dimensions.get("window");
const isMobile = width < 600;
const isTablet = width >= 600 && width < 1024;
const isDesktop = width >= 1024;

export default function PrinterScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("printer");

  const handleTabChange = (key: string) => {
    setActiveTab(key);

    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "printer") {
      // already here
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={["top"]}
    >
      <AdminHeader user={user ? { name: user.name || user.email } : { name: "Admin" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: t("admin.vehicles"), icon: "vehicles" },
              { key: "companies", label: t("admin.companies"), icon: "companies" },
              { key: "discounts", label: t("admin.discounts"), icon: "discounts" },
              { key: "washers", label: t("admin.washers"), icon: "washers" },
              { key: "types", label: t("admin.types"), icon: "types" },
              { key: "pricing", label: t("admin.pricing"), icon: "pricing" },
              { key: "printer", label: t("admin.printer"), icon: "printer" },
              { key: "appusers", label: t("admin.appUsers"), icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <Text variant="titleLarge" style={styles.title}>
            {t("admin.printer.pageTitle")}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {t("admin.printer.subtitle")}
          </Text>

          <Card style={styles.infoCard}>
            <Card.Content>
              <Text variant="bodyMedium">
                This screen is a placeholder so admin navigation stays stable. Printing
                integration will be added here next.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { padding: isMobile ? 8 : isTablet ? 16 : 24 },
  card: {
    borderRadius: 12,
    padding: isMobile ? 16 : isTablet ? 20 : 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: { fontWeight: "bold", marginBottom: 8, marginTop: 8 },
  subtitle: { color: "#757575", marginBottom: 24 },
  infoCard: { marginBottom: 16, marginTop: 8 },
});

