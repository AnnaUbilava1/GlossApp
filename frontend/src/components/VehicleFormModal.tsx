import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { getCarTypeConfigs, type TypeConfig } from "../services/typeConfigService";
import type { Vehicle, CreateVehiclePayload, UpdateVehiclePayload } from "../services/vehicleService";

type VehicleFormValues = {
  licensePlate: string;
  carType: string;
};

type VehicleFormModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (values: CreateVehiclePayload | UpdateVehiclePayload) => Promise<void> | void;
  editingVehicle?: Vehicle | null;
};

export default function VehicleFormModal({
  visible,
  onDismiss,
  onSave,
  editingVehicle,
}: VehicleFormModalProps) {
  const { token } = useAuth();
  const { language } = useLanguage();
  const isEditing = Boolean(editingVehicle);
  const [carTypeConfigs, setCarTypeConfigs] = useState<TypeConfig[]>([]);
  const [values, setValues] = useState<VehicleFormValues>({
    licensePlate: "",
    carType: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && token) {
      getCarTypeConfigs(token)
        .then((configs) => {
          setCarTypeConfigs(configs.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder));
        })
        .catch(() => {});
    }
  }, [visible, token]);

  useEffect(() => {
    if (visible) {
      if (editingVehicle) {
        setValues({
          licensePlate: editingVehicle.licensePlate,
          carType: editingVehicle.carCategory,
        });
      } else {
        const firstCode = carTypeConfigs.length > 0 ? carTypeConfigs[0].code : "";
        setValues({
          licensePlate: "",
          carType: firstCode,
        });
      }
      setError(null);
    }
  }, [visible, editingVehicle, carTypeConfigs]);

  const validate = (): string | null => {
    if (!values.licensePlate.trim()) {
      return "License plate is required";
    }
    if (!values.carType) {
      return "Car type is required";
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateVehiclePayload | UpdateVehiclePayload = {
        licensePlate: values.licensePlate.trim(),
        carType: values.carType as string,
      };

      await onSave(payload);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? "Edit Vehicle" : "Add Vehicle"}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="License Plate *"
            value={values.licensePlate}
            onChangeText={(text) => setValues({ ...values, licensePlate: text.toUpperCase() })}
            mode="outlined"
            style={styles.input}
            autoCapitalize="characters"
            disabled={isEditing}
          />
          <Text variant="bodyMedium" style={styles.sectionTitle}>
            Car Type *
          </Text>
          <RadioButton.Group
            onValueChange={(value) => setValues({ ...values, carType: value })}
            value={values.carType}
          >
            {carTypeConfigs.map((c) => (
              <RadioButton.Item
                key={c.code}
                label={language === "en" ? c.displayNameEn : c.displayNameKa}
                value={c.code}
                style={styles.radioItem}
              />
            ))}
          </RadioButton.Group>
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss} disabled={submitting}>
            Cancel
          </Button>
          <Button onPress={handleSave} mode="contained" loading={submitting} disabled={submitting}>
            {isEditing ? "Update" : "Add"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    backgroundColor: "#FFFFFF",
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "600",
  },
  radioItem: {
    paddingVertical: 4,
  },
});
