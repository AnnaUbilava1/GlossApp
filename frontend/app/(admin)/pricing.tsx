import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    DataTable,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import { CAR_TYPES, SERVICE_TYPES } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

// Mock pricing matrix
const initialPricing: { [key: string]: { [key: string]: number } } = {};
CAR_TYPES.forEach((carType) => {
  initialPricing[carType] = {};
  SERVICE_TYPES.forEach((serviceType) => {
    initialPricing[carType][serviceType] = 0;
  });
});

export default function PricingScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("pricing");
  const [pricing, setPricing] = useState(initialPricing);

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "pricing") {
      // Already here
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handlePriceChange = (carType: string, serviceType: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setPricing({
      ...pricing,
      [carType]: {
        ...pricing[carType],
        [serviceType]: numValue,
      },
    });
  };

  const handleSave = () => {
    // TODO: Save to Firebase
    console.log("Save pricing", pricing);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AdminHeader user={{ name: "John Doe" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: "Vehicles", icon: "vehicles" },
              { key: "companies", label: "Companies", icon: "companies" },
              { key: "discounts", label: "Discounts", icon: "discounts" },
              { key: "washers", label: "Washers", icon: "washers" },
              { key: "pricing", label: "Pricing", icon: "pricing" },
              { key: "appusers", label: "App Users", icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <View style={styles.headerRow}>
            <Text variant="titleLarge" style={styles.title}>
              Service Pricing Matrix
            </Text>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              labelStyle={styles.saveButtonLabel}
            >
              Save All
            </Button>
          </View>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Set base prices for each Car Type + Service Type combination
          </Text>

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>Car Type</DataTable.Title>
                {SERVICE_TYPES.map((service) => (
                  <DataTable.Title key={service} style={styles.priceHeaderCell}>
                    {service}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {CAR_TYPES.map((carType) => (
                <DataTable.Row key={carType} style={styles.tableRow}>
                  <DataTable.Cell style={styles.carTypeCell}>
                    <Text style={styles.carTypeText}>{carType}</Text>
                  </DataTable.Cell>
                  {SERVICE_TYPES.map((serviceType) => (
                    <DataTable.Cell key={serviceType} style={styles.priceCell}>
                      <TextInput
                        mode="outlined"
                        value={pricing[carType]?.[serviceType]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carType, serviceType, value)}
                        keyboardType="numeric"
                        style={styles.priceInput}
                        contentStyle={styles.priceInputContent}
                      />
                    </DataTable.Cell>
                  ))}
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {CAR_TYPES.map((carType) => (
                <View key={carType} style={styles.mobileCard}>
                  <Text variant="titleMedium" style={styles.mobileCarType}>
                    {carType}
                  </Text>
                  {SERVICE_TYPES.map((serviceType) => (
                    <View key={serviceType} style={styles.mobilePriceRow}>
                      <Text variant="bodyMedium" style={styles.mobileServiceLabel}>
                        {serviceType}:
                      </Text>
                      <TextInput
                        mode="outlined"
                        value={pricing[carType]?.[serviceType]?.toString() || "0"}
                        onChangeText={(value) => handlePriceChange(carType, serviceType, value)}
                        keyboardType="numeric"
                        style={styles.mobilePriceInput}
                        contentStyle={styles.mobilePriceInputContent}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? 24 : 16,
  },
  card: {
    borderRadius: 12,
    padding: isTablet ? 32 : 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  subtitle: {
    color: "#757575",
    marginBottom: 24,
  },
  saveButton: {
    backgroundColor: "#2F80ED",
  },
  saveButtonLabel: {
    color: "#FFFFFF",
  },
  table: {
    backgroundColor: "transparent",
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1.5,
  },
  priceHeaderCell: {
    flex: 1,
  },
  carTypeCell: {
    flex: 1.5,
  },
  carTypeText: {
    fontWeight: "600",
  },
  priceCell: {
    flex: 1,
  },
  priceInput: {
    height: 40,
    backgroundColor: "#FAFAFA",
  },
  priceInputContent: {
    paddingVertical: 0,
    fontSize: 14,
  },
  mobileContainer: {
    gap: 16,
  },
  mobileCard: {
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 12,
  },
  mobileCarType: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  mobilePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  mobileServiceLabel: {
    flex: 1,
    color: "#424242",
  },
  mobilePriceInput: {
    flex: 1,
    height: 40,
    backgroundColor: "#FFFFFF",
  },
  mobilePriceInputContent: {
    paddingVertical: 0,
  },
});

