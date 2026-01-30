import React, { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Divider,
  List,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { searchVehicles, VehicleSearchResult } from "../services/vehicleService";

type LicenseAutocompleteProps = {
  value: string;
  onChange: (value: string) => void;
  token: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  onVehicleSelected?: (vehicle: VehicleSearchResult) => void;
};

export default function LicenseAutocomplete({
  value,
  onChange,
  token,
  label = "Car License Number",
  placeholder = "ABC-123",
  required,
  disabled,
  onVehicleSelected,
}: LicenseAutocompleteProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VehicleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Keep query in sync with external value when opening modal
  useEffect(() => {
    if (!visible) return;
    setQuery(value);
  }, [visible, value]);

  // Debounced search
  useEffect(() => {
    if (!visible) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(() => {
      searchVehicles(token, trimmed)
        .then((items) => {
          if (!cancelled) setResults(items);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [token, query, visible]);

  const displayLabel = useMemo(
    () => `${label}${required ? " *" : ""}`,
    [label, required]
  );

  return (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label}>
        {displayLabel}
      </Text>
      <TouchableOpacity
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={{ opacity: disabled ? 0.6 : 1 }}
      >
        <TextInput
          mode="outlined"
          placeholder={placeholder}
          value={value}
          onChangeText={(text) => onChange(text)}
          editable={false}
          style={styles.input}
          contentStyle={styles.inputContent}
          right={<TextInput.Icon icon="chevron-down" />}
        />
      </TouchableOpacity>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => {
            setVisible(false);
            setQuery("");
            setResults([]);
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={{ marginBottom: 12 }}>
            Select {label}
          </Text>
          <TextInput
            mode="outlined"
            placeholder={placeholder}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              onChange(text); // keep external state in sync for free-typed plates
            }}
            style={styles.input}
            contentStyle={styles.inputContent}
          />
          <Divider style={{ marginVertical: 12 }} />
          {loading ? (
            <Text style={{ color: "#757575" }}>Searching...</Text>
          ) : (
            <View style={{ maxHeight: 360 }}>
              {results.map((v) => (
                <List.Item
                  key={v.id}
                  title={v.licensePlate}
                  description={v.carCategory}
                  onPress={() => {
                    onChange(v.licensePlate);
                    if (onVehicleSelected) onVehicleSelected(v);
                    setVisible(false);
                    setQuery("");
                    setResults([]);
                  }}
                />
              ))}
              {results.length === 0 && query.trim().length > 0 && !loading && (
                <Text
                  variant="bodyMedium"
                  style={{ color: "#757575", padding: 12 }}
                >
                  No matching vehicles. The plate will be saved as new.
                </Text>
              )}
            </View>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
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
  modal: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
});

