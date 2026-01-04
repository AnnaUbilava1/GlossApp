import { router } from "expo-router";
import React, { useState } from "react";
import {
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
    Button,
    Text,
    TextInput,
    useTheme
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../src/components/AppHeader";
import TabNavigation from "../../src/components/TabNavigation";
import { CAR_TYPES, SERVICE_TYPES } from "../../src/utils/constants";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function NewRecordScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("new-record");

  // Form state
  const [licenseNumber, setLicenseNumber] = useState("");
  const [carType, setCarType] = useState("");
  const [companyDiscount, setCompanyDiscount] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [price, setPrice] = useState("$0.00");
  const [boxNumber, setBoxNumber] = useState("");
  const [washerName, setWasherName] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");

  const handleTabChange = (key: string) => {
    if (key === "all-records") {
      router.push("/(app)/dashboard");
    }
  };

  const handleAddRecord = () => {
    // TODO: Implement save logic
    console.log("Add record", {
      licenseNumber,
      carType,
      companyDiscount,
      serviceType,
      price,
      boxNumber,
      washerName,
    });
  };

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    onChange: (value: string) => void,
    required = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label}>
        {label} {required && "*"}
      </Text>
      <View style={styles.dropdownContainer}>
        <TextInput
          mode="outlined"
          placeholder={`Select ${label.toLowerCase()}`}
          value={value}
          editable={false}
          style={styles.input}
          contentStyle={styles.inputContent}
          right={<TextInput.Icon icon="chevron-down" />}
        />
        {/* TODO: Implement actual dropdown/picker */}
      </View>
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder?: string,
    required = false,
    disabled = false
  ) => (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label}>
        {label} {required && "*"}
      </Text>
      <TextInput
        mode="outlined"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        disabled={disabled}
        style={styles.input}
        contentStyle={styles.inputContent}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AppHeader user={{ name: "John Doe", role: "staff" }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <TabNavigation
              tabs={[
                { key: "new-record", label: "New Record" },
                { key: "all-records", label: "All Records", count: 0 },
              ]}
              activeTab={activeTab}
              onTabChange={handleTabChange}
            />

            <View style={styles.formHeader}>
              <Text variant="titleLarge" style={styles.formTitle}>
                + Add New Car Wash Record
              </Text>
            </View>

            <View style={styles.formContainer}>
              {/* Two Column Layout */}
              <View style={styles.twoColumnContainer}>
                {/* Left Column */}
                <View style={styles.column}>
                  {renderInput(
                    "Car License Number",
                    licenseNumber,
                    setLicenseNumber,
                    "ABC-123",
                    true
                  )}

                  {renderDropdown(
                    "Company & Discount",
                    companyDiscount,
                    ["Physical Person 30%", "Physical Person 50%", "Company1 30%"],
                    setCompanyDiscount,
                    true
                  )}

                  {renderInput(
                    "Price",
                    price,
                    () => {},
                    undefined,
                    false,
                    true
                  )}

                  {renderDropdown(
                    "Washer Name",
                    washerName,
                    ["Mike Johnson", "Sarah Williams"],
                    setWasherName
                  )}

                  {renderInput(
                    "End Date & Time",
                    endDateTime,
                    setEndDateTime,
                    "mm/dd/yyyy --:--",
                    false,
                    true
                  )}
                </View>

                {/* Right Column */}
                <View style={styles.column}>
                  {renderDropdown(
                    "Car Type",
                    carType,
                    [...CAR_TYPES],
                    setCarType,
                    true
                  )}

                  {renderDropdown(
                    "Service Type",
                    serviceType,
                    [...SERVICE_TYPES],
                    setServiceType
                  )}

                  {renderDropdown(
                    "Car Wash Box Number",
                    boxNumber,
                    ["1", "2", "3", "4", "5"],
                    setBoxNumber
                  )}

                  {renderInput(
                    "Start Date & Time",
                    startDateTime,
                    setStartDateTime,
                    "mm/dd/yyyy --:--",
                    false,
                    true
                  )}
                </View>
              </View>

              {/* Add Record Button */}
              <Button
                mode="contained"
                onPress={handleAddRecord}
                style={styles.addButton}
                contentStyle={styles.addButtonContent}
              >
                Add Record
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  formHeader: {
    marginBottom: 24,
  },
  formTitle: {
    fontWeight: "bold",
    color: "#212121",
  },
  formContainer: {
    width: "100%",
  },
  twoColumnContainer: {
    flexDirection: isTablet ? "row" : "column",
    gap: 16,
    marginBottom: 24,
  },
  column: {
    flex: 1,
    gap: 0,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: "#424242",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FAFAFA",
  },
  inputContent: {
    backgroundColor: "#FAFAFA",
  },
  dropdownContainer: {
    position: "relative",
  },
  addButton: {
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    marginTop: 8,
    alignSelf: "center",
    minWidth: 200,
  },
  addButtonContent: {
    paddingVertical: 8,
  },
});

