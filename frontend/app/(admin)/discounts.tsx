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
  Card,
  IconButton,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

// Mock data
const mockDiscounts = [
  {
    id: "1",
    name: "physical person 30%",
    percentage: 30,
    applicableTo: "Physical Person",
  },
  {
    id: "2",
    name: "physical person 50%",
    percentage: 50,
    applicableTo: "Physical Person",
  },
  {
    id: "3",
    name: "company1 30%",
    percentage: 30,
    applicableTo: "Company1",
  },
  {
    id: "4",
    name: "company2 50%",
    percentage: 50,
    applicableTo: "Company2",
  },
];

export default function DiscountsScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("discounts");
  const [discounts] = useState(mockDiscounts);

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      // Already here
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handleAddDiscount = () => {
    // TODO: Implement add discount modal
    console.log("Add discount");
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit discount
    console.log("Edit discount", id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete discount with PIN check
    console.log("Delete discount", id);
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
              Discount Management
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddDiscount}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Add Discount
            </Button>
          </View>

          <View style={styles.discountsList}>
            {discounts.map((discount) => (
              <Card
                key={discount.id}
                style={styles.discountCard}
                contentStyle={styles.discountCardContent}
              >
                <View style={styles.discountCardHeader}>
                  <View style={styles.discountInfo}>
                    <Text variant="titleMedium" style={styles.discountName}>
                      {discount.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.applicableTo}>
                      Applicable To: {discount.applicableTo}
                    </Text>
                  </View>
                  <Text style={styles.discountPercentage}>
                    {discount.percentage}%
                  </Text>
                </View>
                <View style={styles.discountActions}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    iconColor="#2F80ED"
                    onPress={() => handleEdit(discount.id)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    iconColor="#D32F2F"
                    onPress={() => handleDelete(discount.id)}
                  />
                </View>
              </Card>
            ))}
          </View>
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
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  addButton: {
    backgroundColor: "#2F80ED",
  },
  addButtonLabel: {
    color: "#FFFFFF",
  },
  discountsList: {
    gap: 12,
  },
  discountCard: {
    marginBottom: 12,
    backgroundColor: "#FAFAFA",
  },
  discountCardContent: {
    padding: 16,
  },
  discountCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  discountInfo: {
    flex: 1,
  },
  discountName: {
    fontWeight: "600",
    marginBottom: 4,
  },
  applicableTo: {
    color: "#757575",
  },
  discountPercentage: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2F80ED",
  },
  discountActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
});

