import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
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

// Screen dimensions will be checked dynamically in component

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
  const [screenDimensions, setScreenDimensions] = useState(() => {
    const { width, height } = Dimensions.get("window");
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenDimensions({ width: window.width, height: window.height });
    });
    return () => subscription?.remove();
  }, []);

  const isMobile = screenDimensions.width < 600;
  const isMobileLandscape = isMobile && screenDimensions.width > screenDimensions.height;

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

  // Create responsive styles
  const styles = useMemo(() => {
    const isMobile = screenDimensions.width < 600;
    const isMobileLandscape = isMobile && screenDimensions.width > screenDimensions.height;
    const isTablet = screenDimensions.width >= 600 && screenDimensions.width < 1024;
    
    return StyleSheet.create({
      fieldContainer: {
        marginBottom: isMobileLandscape ? 4 : isMobile ? 4 : isTablet ? 12 : 20,
        minHeight: isMobile && !isMobileLandscape ? 70 : undefined,
      },
      label: {
        marginBottom: isMobileLandscape ? 3 : isMobile ? 4 : isTablet ? 6 : 8,
        color: "#424242",
        fontWeight: "500",
        fontSize: isMobileLandscape ? 11 : isMobile ? 12 : undefined,
        flexWrap: "wrap",
        flexShrink: 1,
      },
      input: {
        backgroundColor: "#FAFAFA",
        height: isMobileLandscape ? 36 : isMobile ? 44 : isTablet ? 48 : undefined,
      },
      inputContent: {
        backgroundColor: "#FAFAFA",
        fontSize: isMobileLandscape ? 12 : isMobile ? 14 : undefined,
        paddingVertical: isMobileLandscape ? 4 : isMobile ? 8 : undefined,
      },
      modal: {
        marginHorizontal: isMobileLandscape ? 8 : isMobile ? 12 : 16,
        borderRadius: 12,
        padding: isMobileLandscape ? 8 : isMobile ? 12 : 16,
        maxHeight: isMobileLandscape ? screenDimensions.height * 0.6 : isMobile ? screenDimensions.height * 0.7 : screenDimensions.height * 0.8,
      },
    });
  }, [screenDimensions]);

  return (
    <View style={styles.fieldContainer}>
      <Text variant="labelMedium" style={styles.label} numberOfLines={2} ellipsizeMode="tail">
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
          <Text variant="titleMedium" style={{ marginBottom: isMobileLandscape ? 6 : isMobile ? 8 : 12, fontSize: isMobileLandscape ? 13 : isMobile ? 16 : undefined }}>
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
          <Divider style={{ marginVertical: isMobileLandscape ? 6 : isMobile ? 8 : 12 }} />
          {loading ? (
            <Text style={{ color: "#757575", fontSize: isMobileLandscape ? 11 : isMobile ? 13 : undefined }}>Searching...</Text>
          ) : (
            <View style={{ maxHeight: isMobileLandscape ? screenDimensions.height * 0.4 : isMobile ? screenDimensions.height * 0.4 : 360 }}>
              {results.map((v) => (
                <List.Item
                  key={v.id}
                  title={v.licensePlate}
                  description={v.carCategory}
                  titleStyle={{ fontSize: isMobileLandscape ? 12 : isMobile ? 14 : undefined }}
                  descriptionStyle={{ fontSize: isMobileLandscape ? 10 : isMobile ? 12 : undefined }}
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
                  style={{ color: "#757575", padding: isMobileLandscape ? 6 : isMobile ? 8 : 12, fontSize: isMobileLandscape ? 11 : isMobile ? 13 : undefined }}
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
