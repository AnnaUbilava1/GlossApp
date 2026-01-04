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
const mockCompanies = [
  {
    id: "1",
    name: "Company1",
    contactPerson: "Bob Johnson",
    email: "contact@company1.com",
    phone: "+1234567892",
    defaultDiscount: 30,
  },
  {
    id: "2",
    name: "Company2",
    contactPerson: "Alice Brown",
    email: "contact@company2.com",
    phone: "+1234567893",
    defaultDiscount: 50,
  },
];

export default function CompaniesScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("companies");
  const [companies] = useState(mockCompanies);

  const handleTabChange = (key: string) => {
    if (key === "customers") {
      // TODO: Navigate to customers
    } else if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      // Already here
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    }
  };

  const handleAddCompany = () => {
    // TODO: Implement add company modal
    console.log("Add company");
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit company
    console.log("Edit company", id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete company with PIN check
    console.log("Delete company", id);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AdminHeader user={{ name: "John Doe" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "customers", label: "Customers", icon: "customers" },
              { key: "vehicles", label: "Vehicles", icon: "vehicles" },
              { key: "companies", label: "Companies", icon: "companies" },
              { key: "discounts", label: "% Discounts", icon: "discounts" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <View style={styles.headerRow}>
            <Text variant="titleLarge" style={styles.title}>
              Partner Companies
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddCompany}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Add Company
            </Button>
          </View>

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>Company Name</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Contact Person</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Email</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Phone</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Default Discount</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Actions</DataTable.Title>
              </DataTable.Header>

              {companies.map((company) => (
                <DataTable.Row key={company.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{company.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{company.contactPerson}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{company.email}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{company.phone}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Text style={styles.discountText}>{company.defaultDiscount}%</Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                        onPress={() => handleEdit(company.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDelete(company.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {companies.map((company) => (
                <View key={company.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{company.name}</Text>
                    <Text style={[styles.discountText, { fontSize: 16 }]}>
                      {company.defaultDiscount}%
                    </Text>
                  </View>
                  <Text variant="bodyMedium">{company.contactPerson}</Text>
                  <Text variant="bodySmall" style={styles.mobileDetails}>
                    {company.email}
                  </Text>
                  <Text variant="bodySmall" style={styles.mobileDetails}>
                    {company.phone}
                  </Text>
                  <View style={styles.mobileActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#2F80ED"
                      onPress={() => handleEdit(company.id)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDelete(company.id)}
                    />
                  </View>
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
  table: {
    backgroundColor: "transparent",
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  discountText: {
    color: "#2F80ED",
    fontWeight: "600",
  },
  actionsCell: {
    flex: 0.8,
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mobileContainer: {
    gap: 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileDetails: {
    color: "#757575",
    marginTop: 4,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
});

