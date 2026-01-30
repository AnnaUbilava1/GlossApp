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
import type { User, UserRole } from "../utils/types";

type UserFormValues = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
};

type UserFormModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (values: UserFormValues) => Promise<void> | void;
  editingUser?: User | null;
};

export default function UserFormModal({
  visible,
  onDismiss,
  onSave,
  editingUser,
}: UserFormModalProps) {
  const isEditing = Boolean(editingUser);
  const [values, setValues] = useState<UserFormValues>({
    email: "",
    password: "",
    role: "staff",
    name: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingUser) {
        setValues({
          email: editingUser.email,
          password: "",
          role: editingUser.role,
          name: editingUser.name || "",
        });
      } else {
        setValues({
          email: "",
          password: "",
          role: "staff",
          name: "",
        });
      }
      setError(null);
      setSubmitting(false);
    }
  }, [visible, editingUser]);

  const updateField = <K extends keyof UserFormValues>(
    key: K,
    value: UserFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!values.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!values.email.includes("@")) {
      setError("Email must be valid");
      return false;
    }
    if (!isEditing || values.password.trim()) {
      if (!values.password.trim()) {
        setError("Password is required");
        return false;
      }
      if (values.password.trim().length < 6) {
        setError("Password must be at least 6 characters");
        return false;
      }
    }
    if (!values.role) {
      setError("Role is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSave(values);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Failed to save user. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onDismiss();
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose}>
        <Dialog.Title>{isEditing ? "Edit User" : "Add User"}</Dialog.Title>
        <Dialog.Content>
          <TextInput
            label="Email"
            value={values.email}
            onChangeText={(text) => updateField("email", text)}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            label={isEditing ? "Password (leave blank to keep)" : "Password"}
            value={values.password}
            onChangeText={(text) => updateField("password", text)}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="Name"
            value={values.name}
            onChangeText={(text) => updateField("name", text)}
            style={styles.input}
          />

          <Text style={styles.roleLabel}>Role</Text>
          <RadioButton.Group
            onValueChange={(value) => updateField("role", value as UserRole)}
            value={values.role}
          >
            <RadioButton.Item label="Staff" value="staff" />
            <RadioButton.Item label="Admin" value="admin" />
          </RadioButton.Group>

          {error ? (
            <HelperText type="error" visible={true}>
              {error}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={submitting}
            disabled={submitting}
          >
            {isEditing ? "Save Changes" : "Create User"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 8,
  },
  roleLabel: {
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
  },
});

