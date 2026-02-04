import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";
import {
  Button,
  Chip,
  DataTable,
  Dialog,
  IconButton,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import AdminHeader from "../../src/components/AdminHeader";
import AdminTabs from "../../src/components/AdminTabs";
import MasterPinModal from "../../src/components/MasterPinModal";
import UserFormModal from "../../src/components/UserFormModal";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";
import type { User } from "../../src/utils/types";
import {
  createUser,
  deleteUser,
  getAllUsers,
  resetUserPassword,
} from "../../src/services/userService";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function AppUsersScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("appusers");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formVisible, setFormVisible] = useState(false);
  const [pinVisible, setPinVisible] = useState(false);
  const [pinAction, setPinAction] = useState<"reset" | "delete" | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [masterPinForAction, setMasterPinForAction] = useState<string | null>(
    null
  );

  const [passwordDialogVisible, setPasswordDialogVisible] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadUsers = async () => {
    if (!auth.token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAllUsers(auth.token);
      setUsers(data);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : t("admin.appUsers.loadFailed");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (auth.token) {
      loadUsers();
    } else {
      setUsers([]);
    }
  }, [auth.token]);

  const handleTabChange = (key: string) => {
    if (key === "vehicles") {
      router.push("/(admin)/vehicles");
    } else if (key === "companies") {
      router.push("/(admin)/companies");
    } else if (key === "discounts") {
      router.push("/(admin)/discounts");
    } else if (key === "washers") {
      router.push("/(admin)/washers");
    } else if (key === "pricing") {
      router.push("/(admin)/pricing");
    } else if (key === "types") {
      router.push("/(admin)/types");
    } else if (key === "appusers") {
      // Already here
    }
  };

  const handleAddUser = () => {
    setFormVisible(true);
  };

  const handleResetPassword = (id: string) => {
    setSelectedUserId(id);
    setPinAction("reset");
    setPinVisible(true);
  };

  const handleDelete = (id: string) => {
    setSelectedUserId(id);
    setPinAction("delete");
    setPinVisible(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["top"]}>
      <AdminHeader user={auth.user ? { name: auth.user.name || auth.user.email } : { name: "Admin" }} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <AdminTabs
            tabs={[
              { key: "vehicles", label: t("admin.vehicles"), icon: "vehicles" },
              { key: "companies", label: t("admin.companies"), icon: "companies" },
              { key: "discounts", label: t("admin.discounts"), icon: "discounts" },
              { key: "washers", label: t("admin.washers"), icon: "washers" },
              { key: "types", label: t("admin.types"), icon: "types" },
              { key: "pricing", label: t("admin.pricing"), icon: "pricing" },
              { key: "appusers", label: t("admin.appUsers"), icon: "appusers" },
            ]}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />

          <View style={styles.headerRow}>
            <Text variant="titleLarge" style={styles.title}>
              {t("admin.appUsers.pageTitle")}
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleAddUser}
              style={styles.addButton}
              labelStyle={styles.addButtonLabel}
            >
              {t("admin.appUsers.addUser")}
            </Button>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {loading ? (
            <Text>{t("admin.loading")}</Text>
          ) : isTablet ? (
            <DataTable style={styles.table}>
              <DataTable.Header>
                <DataTable.Title style={styles.headerCell}>{t("admin.appUsers.name")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.appUsers.email")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.appUsers.role")}</DataTable.Title>
                <DataTable.Title style={styles.headerCell}>{t("admin.actions")}</DataTable.Title>
              </DataTable.Header>

              {users.map((user) => (
                <DataTable.Row key={user.id} style={styles.tableRow}>
                  <DataTable.Cell style={styles.cell}>{user.name}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>{user.email}</DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    <Chip
                      mode="flat"
                      style={[
                        styles.roleChip,
                        user.role === "admin" && styles.adminChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {user.role === "admin" ? t("admin.appUsers.admin") : t("admin.appUsers.staff")}
                    </Chip>
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.actionsCell}>
                    <View style={styles.actionsContainer}>
                      <IconButton
                        icon="key"
                        size={20}
                        iconColor="#FF9800"
                        onPress={() => handleResetPassword(user.id)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        iconColor="#D32F2F"
                        onPress={() => handleDelete(user.id)}
                      />
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <View style={styles.mobileContainer}>
              {users.map((user) => (
                <View key={user.id} style={styles.mobileCard}>
                  <View style={styles.mobileCardHeader}>
                    <Text variant="titleMedium">{user.name}</Text>
                    <Chip
                      mode="flat"
                      style={[
                        styles.roleChip,
                        user.role === "admin" && styles.adminChip,
                      ]}
                      textStyle={styles.chipText}
                    >
                      {user.role === "admin" ? t("admin.appUsers.admin") : t("admin.appUsers.staff")}
                    </Chip>
                  </View>
                  <Text variant="bodyMedium" style={styles.mobileEmail}>
                    {user.email}
                  </Text>
                  <View style={styles.mobileActions}>
                    <Button
                      mode="outlined"
                      icon="key"
                      onPress={() => handleResetPassword(user.id)}
                      style={styles.resetButton}
                    >
                      {t("admin.appUsers.resetPassword")}
                    </Button>
                    <IconButton
                      icon="delete"
                      size={20}
                      iconColor="#D32F2F"
                      onPress={() => handleDelete(user.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
          <UserFormModal
            visible={formVisible}
            onDismiss={() => setFormVisible(false)}
            editingUser={null}
            onSave={async (values) => {
              if (!auth.token) return;
              setActionError(null);
              setActionLoading(true);
              try {
                await createUser(auth.token, {
                  email: values.email.trim(),
                  password: values.password.trim(),
                  role: values.role,
                  name: values.name.trim() || undefined,
                });
                await loadUsers();
                setFormVisible(false);
              } catch (e) {
                const msg =
                  e instanceof Error
                    ? e.message
                    : t("admin.appUsers.createFailed");
                setActionError(msg);
              } finally {
                setActionLoading(false);
              }
            }}
          />
          <MasterPinModal
            visible={pinVisible}
            onDismiss={() => {
              setPinVisible(false);
              setPinAction(null);
              setSelectedUserId(null);
              setMasterPinForAction(null);
              setActionError(null);
            }}
            onCorrectPin={(pin) => {
              setMasterPinForAction(pin);
              setPinVisible(false);
              if (!selectedUserId || !auth.token || !pinAction) return;
              if (pinAction === "reset") {
                setPasswordDialogVisible(true);
              } else if (pinAction === "delete") {
                (async () => {
                  setActionLoading(true);
                  setActionError(null);
                  try {
                    await deleteUser(auth.token!, selectedUserId, pin);
                    await loadUsers();
                    setSelectedUserId(null);
                    setPinAction(null);
                    setMasterPinForAction(null);
                  } catch (e) {
                    const msg =
                      e instanceof Error
                        ? e.message
                        : t("admin.appUsers.deleteFailed");
                    setActionError(msg);
                  } finally {
                    setActionLoading(false);
                  }
                })();
              }
            }}
          />
          <Portal>
            <Dialog
              visible={passwordDialogVisible}
              onDismiss={() => {
                if (!actionLoading) {
                  setPasswordDialogVisible(false);
                  setNewPassword("");
                  setActionError(null);
                }
              }}
            >
              <Dialog.Title>{t("admin.appUsers.resetPassword")}</Dialog.Title>
              <Dialog.Content>
                <TextInput
                  label={t("admin.appUsers.newPassword")}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (actionError) setActionError(null);
                  }}
                  secureTextEntry
                  style={styles.passwordInput}
                />
                {actionError ? (
                  <Text style={styles.errorText}>{actionError}</Text>
                ) : null}
              </Dialog.Content>
              <Dialog.Actions>
                <Button
                  onPress={() => {
                    if (!actionLoading) {
                      setPasswordDialogVisible(false);
                      setNewPassword("");
                      setActionError(null);
                    }
                  }}
                  disabled={actionLoading}
                >
                  {t("admin.appUsers.cancel")}
                </Button>
                <Button
                  mode="contained"
                  onPress={async () => {
                    if (!auth.token || !selectedUserId || !masterPinForAction) {
                      return;
                    }
                    const trimmed = newPassword.trim();
                    if (!trimmed || trimmed.length < 6) {
                      setActionError(
                        t("admin.appUsers.passwordMinLength")
                      );
                      return;
                    }
                    setActionLoading(true);
                    setActionError(null);
                    try {
                      await resetUserPassword(
                        auth.token,
                        selectedUserId,
                        trimmed,
                        masterPinForAction
                      );
                      await loadUsers();
                      setPasswordDialogVisible(false);
                      setNewPassword("");
                      setSelectedUserId(null);
                      setMasterPinForAction(null);
                      setPinAction(null);
                    } catch (e) {
                      const msg =
                        e instanceof Error
                          ? e.message
                          : t("admin.appUsers.resetFailed");
                      setActionError(msg);
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  loading={actionLoading}
                  disabled={actionLoading}
                >
                  {t("admin.appUsers.save")}
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isTablet ? 24 : 16,
  },
  card: {
    borderRadius: 12,
    padding: isTablet ? 32 : 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontWeight: "bold",
    color: "#212121",
  },
  addButton: {
    backgroundColor: "#2F80ED",
  },
  addButtonLabel: {
    color: "#FFFFFF",
  },
  table: {
    backgroundColor: "transparent",
  },
  tableRow: {
    minHeight: 60,
  },
  headerCell: {
    flex: 1,
  },
  cell: {
    flex: 1,
  },
  roleChip: {
    backgroundColor: "#E3F2FD",
  },
  adminChip: {
    backgroundColor: "#FFF3E0",
  },
  chipText: {
    fontSize: 12,
  },
  actionsCell: {
    flex: 1,
    justifyContent: "center",
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mobileContainer: {
    gap: 12,
  },
  mobileCard: {
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FAFAFA",
    marginBottom: 12,
  },
  mobileCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mobileEmail: {
    color: "#757575",
    marginBottom: 12,
  },
  mobileActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resetButton: {
    flex: 1,
  },
  errorText: {
    color: "#D32F2F",
    marginBottom: 8,
  },
  passwordInput: {
    marginTop: 4,
  },
});

