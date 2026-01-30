import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text, TextInput } from "react-native-paper";
import { MASTER_PIN } from "../utils/constants";

type MasterPinModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onCorrectPin: (pin: string) => void;
  title?: string;
  description?: string;
};

export default function MasterPinModal({
  visible,
  onDismiss,
  onCorrectPin,
  title = "Admin PIN Required",
  description = "Enter the master PIN to continue.",
}: MasterPinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      setPin("");
      setError(null);
      onDismiss();
    }
  };

  const handleConfirm = () => {
    setError(null);
    const trimmed = pin.trim();
    if (!trimmed) {
      setError("PIN is required");
      return;
    }
    setSubmitting(true);
    try {
      if (trimmed !== MASTER_PIN) {
        setError("Incorrect PIN");
        return;
      }
      onCorrectPin(trimmed);
      setPin("");
      setError(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleClose}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.description}>{description}</Text>
          <TextInput
            label="Master PIN"
            value={pin}
            onChangeText={(text) => {
              setPin(text);
              if (error) setError(null);
            }}
            secureTextEntry
            keyboardType="number-pad"
            style={styles.input}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            loading={submitting}
            disabled={submitting}
          >
            Confirm
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  description: {
    marginBottom: 8,
  },
  input: {
    marginTop: 4,
  },
  error: {
    marginTop: 4,
    color: "#D32F2F",
  },
});

