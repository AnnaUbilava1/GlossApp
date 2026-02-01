import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Dialog, Portal, Text } from "react-native-paper";

type PaymentMethodModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (method: "cash" | "card") => void;
  title?: string;
  description?: string;
};

export default function PaymentMethodModal({
  visible,
  onDismiss,
  onSelect,
  title = "Select Payment Method",
  description = "Choose how the payment was made:",
}: PaymentMethodModalProps) {
  const handleSelect = (method: "cash" | "card") => {
    onSelect(method);
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.description}>{description}</Text>
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handleSelect("cash")}
              style={[styles.button, styles.cashButton]}
              contentStyle={styles.buttonContent}
            >
              Cash
            </Button>
            <Button
              mode="contained"
              onPress={() => handleSelect("card")}
              style={[styles.button, styles.cardButton]}
              contentStyle={styles.buttonContent}
            >
              Card
            </Button>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  description: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
  },
  cashButton: {
    backgroundColor: "#4CAF50",
  },
  cardButton: {
    backgroundColor: "#2196F3",
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

