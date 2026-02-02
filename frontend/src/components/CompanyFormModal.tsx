import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import {
  Button,
  Dialog,
  HelperText,
  Portal,
  Text,
  TextInput,
  Chip,
} from "react-native-paper";
import type { Company, CreateCompanyPayload, UpdateCompanyPayload } from "../services/companyService";

type CompanyFormValues = {
  name: string;
  contact: string;
  discountPercentages: number[];
};

type CompanyFormModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSave: (values: CreateCompanyPayload | UpdateCompanyPayload) => Promise<void> | void;
  editingCompany?: Company | null;
};

const AVAILABLE_DISCOUNT_PERCENTAGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

export default function CompanyFormModal({
  visible,
  onDismiss,
  onSave,
  editingCompany,
}: CompanyFormModalProps) {
  const isEditing = Boolean(editingCompany);
  const [values, setValues] = useState<CompanyFormValues>({
    name: "",
    contact: "",
    discountPercentages: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      if (editingCompany) {
        setValues({
          name: editingCompany.name,
          contact: editingCompany.contact,
          discountPercentages: editingCompany.discounts.map((d) => d.percentage),
        });
      } else {
        setValues({
          name: "",
          contact: "",
          discountPercentages: [],
        });
      }
      setError(null);
    }
  }, [visible, editingCompany]);

  const validate = (): string | null => {
    if (!values.name.trim()) {
      return "Company name is required";
    }
    if (!values.contact.trim()) {
      return "Contact information is required";
    }
    return null;
  };

  const toggleDiscount = (percentage: number) => {
    setValues((prev) => {
      const current = prev.discountPercentages;
      if (current.includes(percentage)) {
        return { ...prev, discountPercentages: current.filter((p) => p !== percentage) };
      } else {
        return { ...prev, discountPercentages: [...current, percentage].sort((a, b) => a - b) };
      }
    });
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
      const payload: CreateCompanyPayload | UpdateCompanyPayload = {
        name: values.name.trim(),
        contact: values.contact.trim(),
        discountPercentages: values.discountPercentages.length > 0 ? values.discountPercentages : undefined,
      };

      await onSave(payload);
      onDismiss();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save company");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{isEditing ? "Edit Company" : "Add Company"}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <TextInput
              label="Company Name *"
              value={values.name}
              onChangeText={(text) => setValues({ ...values, name: text })}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Contact Information *"
              value={values.contact}
              onChangeText={(text) => setValues({ ...values, contact: text })}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
              placeholder="Name, email, phone, etc."
            />
            <Text variant="bodyMedium" style={styles.sectionTitle}>
              Discount Options
            </Text>
            <View style={styles.chipContainer}>
              {AVAILABLE_DISCOUNT_PERCENTAGES.map((percentage) => (
                <Chip
                  key={percentage}
                  selected={values.discountPercentages.includes(percentage)}
                  onPress={() => toggleDiscount(percentage)}
                  style={styles.chip}
                >
                  {percentage}%
                </Chip>
              ))}
            </View>
            {values.discountPercentages.length > 0 && (
              <Text variant="bodySmall" style={styles.selectedText}>
                Selected: {values.discountPercentages.join("%, ")}%
              </Text>
            )}
            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}
          </ScrollView>
        </Dialog.ScrollArea>
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
    maxHeight: "80%",
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 4,
  },
  input: {
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "600",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 4,
    marginBottom: 4,
  },
  selectedText: {
    color: "#757575",
    fontStyle: "italic",
    marginBottom: 8,
  },
});
