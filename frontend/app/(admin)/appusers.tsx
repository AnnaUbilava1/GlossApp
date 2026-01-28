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
    Chip,
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
const mockUsers = [
  {
    id: "1",
    email: "admin@carwash.com",
    role: "admin",
    name: "John Doe",
  },
  {
    id: "2",
    email: "staff1@carwash.com",
    role: "staff",
    name: "Mike Johnson",
  },
  {
    id: "3",
    email: "staff2@carwash.com",
    role: "staff",
    name: "Sarah Williams",
  },
];

export default function AppUsersScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("appusers");
  const [users] = useState(mockUsers);

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
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      // Already here
    }
  };

  const handleAddUser = () => {
    // TODO: Implement add user modal
    console.log("Add user");
  };

  const handleResetPassword = (id: string) => {
    // TODO: Implement reset password
    console.log("Reset password for user", id);
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete user with PIN check
    console.log("Delete user", id);
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
              Staff User Management
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddUser}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Add User
            </Button>
          </View>

          {isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>Name</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Email</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Role</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>Actions</DataTable.Title>
              </DataTable.Header>

              {users.map((user) => (
                <DataTable.Row key={user.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{user.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{user.email}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Chip
                      mode="flat"
                      style={[
                        styles.roleChip,
                        user.role === "admin" && styles.adminChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="key"
                        size={20}
                        iconColor="#FF9800"
                        onPress={() => handleResetPassword(user.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDelete(user.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {users.map((user) => (
                <View key={user.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{user.name}</Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.roleChip,
                        user.role === "admin" && styles.adminChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {user.role === "admin" ? "Admin" : "Staff"}
                    </Chip>
                  </View>
                  <Text variant="bodyMedium" style={styles.mobileEmail}>
                    {user.email}
                  </Text>
                  <View style={styles.mobileActions}>
                    <Button
                      mode="outlined"
                      icon="key"
                      onPress={() => handleResetPassword(user.id)}
                      style={styles.resetButton}
                    >
                      Reset Password
                    </Button>
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDelete(user.id)}
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
  roleChip: {
    backgroundColor: "#E3F2FD",
  },
  adminChip: {
    backgroundColor: "#FFF3E0",
  },
  chipText: {
    fontSize: 12,
  },
  actionsCell: {
    flex: 1,
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
  mobileEmail: {
    color: "#757575",
    marginBottom: 12,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButton: {
    flex: 1,
  },
});

