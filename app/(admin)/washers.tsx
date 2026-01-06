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
    IconButton,
    Text,
    TextInput,
    useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

// Mock data
const mockWashers = [
  { id: "1", name: "Mike Johnson" },
  { id: "2", name: "Sarah Williams" },
  { id: "3", name: "John Smith" },
];

export default function WashersScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("washers");
  const [washers, setWashers] = useState(mockWashers);
  const [newWasherName, setNewWasherName] = useState("");

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      // Already here
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "appusers") {
      router.push("/(admin)/appusers");
    }
  };

  const handleAddWasher = () => {
    if (newWasherName.trim()) {
      const newWasher = {
        id: Date.now().toString(),
        name: newWasherName.trim(),
      };
      setWashers([...washers, newWasher]);
      setNewWasherName("");
      // TODO: Save to Firebase
    }
  };

  const handleDelete = (id: string) => {
    // TODO: Implement delete with PIN check
    setWashers(washers.filter((w) => w.id !== id));
    console.log("Delete washer", id);
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
              Washer Management
            </Text>
          </View>

          {/* Add Washer Form */}
          <View style={styles.addForm}>
            <TextInput
              mode="outlined"
              label="Washer Name"
              value={newWasherName}
              onChangeText={setNewWasherName}
              style={styles.input}
              placeholder="Enter washer name"
            />
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddWasher}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              Add Washer
            </Button>
          </View>

          {/* Washers List */}
          <View style={styles.listContainer}>
            {washers.map((washer) => (
              <View key={washer.id} style={styles.washerItem}>
                <Text variant="bodyLarge" style={styles.washerName}>
                  {washer.name}
                </Text>
                <IconButton
                  icon="delete"
                  size={20}
                  iconColor="#D32F2F"
                  onPress={() => handleDelete(washer.id)}
                />
              </View>
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
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  addForm: {
    marginBottom: 24,
    gap: 12,
  },
  input: {
    backgroundColor: "#FAFAFA",
  },
  addButton: {
    backgroundColor: "#2F80ED",
  },
  addButtonLabel: {
    color: "#FFFFFF",
  },
  listContainer: {
    gap: 8,
  },
  washerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    marginBottom: 8,
  },
  washerName: {
    flex: 1,
    fontWeight: "500",
  },
});

