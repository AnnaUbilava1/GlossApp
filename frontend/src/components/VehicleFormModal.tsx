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
import type { CarType } from "../utils/types";
import { CAR_TYPES } from "../utils/constants";
import type { Vehicle, CreateVehiclePayload, UpdateVehiclePayload } from "../services/vehicleService";

type VehicleFormValues = {
  licensePlate: string;
  carType: CarType;
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
  const isEditing = Boolean(editingVehicle);
  const [values, setValues] = useState<VehicleFormValues>({
    licensePlate: "",
    carType: "Sedan",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingVehicle) {
        setValues({
          licensePlate: editingVehicle.licensePlate,
          carType: editingVehicle.carCategory as CarType,
        });
      } else {
        setValues({
          licensePlate: "",
          carType: "Sedan",
        });
      }
      setError(null);
    }
  }, [visible, editingVehicle]);

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
        carType: values.carType,
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
            onValueChange={(value) => setValues({ ...values, carType: value as CarType })}
            value={values.carType}
          >
            {CAR_TYPES.map((carType) => (
              <RadioButton.Item
                key={carType}
                label={carType}
                value={carType}
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
