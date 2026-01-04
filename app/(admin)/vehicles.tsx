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
const mockVehicles = [
  {
    id: "1",
    licenseNumber: "ABC-123",
    carType: "Sedan",
    owner: "John Smith",
    color: "Black",
  },
  {
    id: "2",
    licenseNumber: "XYZ-789",
    carType: "Jeep",
    owner: "Jane Doe",
    color: "White",
  },
];

export default function VehiclesScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("vehicles");
  const [vehicles] = useState(mockVehicles);

  const handleTabChange = (key: string) => {
    if (key === "customers") {
      // TODO: Navigate to customers
    } else if (key === "vehicles") {
      // Already here
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    }
  };

  const handleAddVehicle = () => {
    // TODO: Implement add vehicle modal
    console.log("Add vehicle");
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit vehicle
    console.log("Edit vehicle", id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete vehicle with PIN check
    console.log("Delete vehicle", id);
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
              Vehicle Database
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddVehicle}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Add Vehicle
            </Button>
          </View>

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>License Number</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Car Type</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Owner</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Color</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Actions</DataTable.Title>
              </DataTable.Header>

              {vehicles.map((vehicle) => (
                <DataTable.Row key={vehicle.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{vehicle.licenseNumber}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{vehicle.carType}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{vehicle.owner}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{vehicle.color}</DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        iconColor="#2F80ED"
                        onPress={() => handleEdit(vehicle.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDelete(vehicle.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {vehicles.map((vehicle) => (
                <View key={vehicle.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{vehicle.licenseNumber}</Text>
                    <Text variant="bodyMedium" style={styles.carTypeText}>
                      {vehicle.carType}
                    </Text>
                  </View>
                  <Text variant="bodyMedium">{vehicle.owner}</Text>
                  <Text variant="bodySmall" style={styles.mobileDetails}>
                    Color: {vehicle.color}
                  </Text>
                  <View style={styles.mobileActions}>
                    <IconButton
                      icon="pencil"
                      size={20}
                      iconColor="#2F80ED"
                      onPress={() => handleEdit(vehicle.id)}
                    />
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDelete(vehicle.id)}
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
  carTypeText: {
    color: "#757575",
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

