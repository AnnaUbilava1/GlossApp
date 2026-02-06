import React, { useState } from "react";
import { Dimensions, ScrollView, StyleSheet } from "react-native";
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
  
  // Detect landscape mode
  const { width, height } = Dimensions.get("window");
  const isLandscape = width > height;
  const isMobile = width < 600;

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
      <Dialog 
        visible={visible} 
        onDismiss={handleClose}
        style={[
          styles.dialog,
          isMobile && isLandscape && styles.dialogLandscape
        ]}
      >
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={styles.scrollArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Dialog.Content style={styles.dialogContent}>
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
                autoFocus={false}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
            </Dialog.Content>
          </ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.dialogActions}>
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
  dialog: {
    maxHeight: "90%",
    marginHorizontal: 20,
  },
  dialogLandscape: {
    maxHeight: "80%",
    marginHorizontal: 30,
    marginTop: 20,
  },
  scrollArea: {
    maxHeight: 200,
    paddingHorizontal: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 8,
  },
  dialogContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
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
  dialogActions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingTop: 8,
    minHeight: 52,
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 0, 0, 0.12)",
  },
});

