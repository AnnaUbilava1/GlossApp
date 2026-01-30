import React, { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import type { Washer, CreateWasherPayload, UpdateWasherPayload } from "../services/washerService";

type WasherFormValues = {
  username: string;
  name: string;
  surname: string;
  contact: string;
  salaryPercentage: string;
};

type WasherFormModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (values: CreateWasherPayload | UpdateWasherPayload) => Promise<void> | void;
  editingWasher?: Washer | null;
};

export default function WasherFormModal({
  visible,
  onDismiss,
  onSave,
  editingWasher,
}: WasherFormModalProps) {
  const isEditing = Boolean(editingWasher);
  const [values, setValues] = useState<WasherFormValues>({
    username: "",
    name: "",
    surname: "",
    contact: "",
    salaryPercentage: "0",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingWasher) {
        setValues({
          username: editingWasher.username,
          name: editingWasher.name || "",
          surname: editingWasher.surname || "",
          contact: editingWasher.contact || "",
          salaryPercentage: editingWasher.salaryPercentage.toString(),
        });
      } else {
        setValues({
          username: "",
          name: "",
          surname: "",
          contact: "",
          salaryPercentage: "0",
        });
      }
      setError(null);
    }
  }, [visible, editingWasher]);

  const validate = (): string | null => {
    if (!values.username.trim()) {
      return "Username is required";
    }
    const salaryPercent = parseFloat(values.salaryPercentage);
    if (isNaN(salaryPercent) || salaryPercent < 0 || salaryPercent > 100) {
      return "Salary percentage must be between 0 and 100";
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
      if (isEditing) {
        const payload: UpdateWasherPayload = {
          name: values.name.trim() || undefined,
          surname: values.surname.trim() || undefined,
          contact: values.contact.trim() || undefined,
          salaryPercentage: parseFloat(values.salaryPercentage) || 0,
        };
        await onSave(payload);
      } else {
        const payload: CreateWasherPayload = {
          username: values.username.trim(),
          name: values.name.trim() || undefined,
          surname: values.surname.trim() || undefined,
          contact: values.contact.trim() || undefined,
          salaryPercentage: parseFloat(values.salaryPercentage) || 0,
        };
        await onSave(payload);
      }
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save washer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? "Edit Washer" : "Add Washer"}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Username *"
            value={values.username}
            onChangeText={(text) => setValues({ ...values, username: text })}
            mode="outlined"
            style={styles.input}
            disabled={isEditing}
            autoCapitalize="none"
            helperText={isEditing ? "Username cannot be changed once created" : "Must be unique for each washer"}
          />
          <TextInput
            label="Name"
            value={values.name}
            onChangeText={(text) => setValues({ ...values, name: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Surname"
            value={values.surname}
            onChangeText={(text) => setValues({ ...values, surname: text })}
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Contact"
            value={values.contact}
            onChangeText={(text) => setValues({ ...values, contact: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
          />
          <TextInput
            label="Salary Percentage (%)"
            value={values.salaryPercentage}
            onChangeText={(text) => setValues({ ...values, salaryPercentage: text })}
            mode="outlined"
            style={styles.input}
            keyboardType="numeric"
          />
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
    marginBottom: 8,
  },
});
