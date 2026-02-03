import { router } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Button, Text, TextInput, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../src/context/AuthContext";
import { useLanguage } from "../../src/context/LanguageContext";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function LoginScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await auth.login(email, password);
      const role = user.role || "staff";
      if (role === "admin") {
        router.replace("/(admin)");
      } else {
        router.replace("/(app)");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>💧</Text>
              </View>
            </View>

            {/* Welcome Text */}
            <Text variant="headlineMedium" style={styles.welcomeText}>
              {t("auth.welcome")}
            </Text>
            <Text variant="bodyMedium" style={styles.subtitleText}>
              {t("auth.subtitle")}
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" style={styles.label}>
                  {t("auth.email")}
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder={t("auth.emailPlaceholder")}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  outlineColor="rgba(47, 128, 237, 0.25)"
                  activeOutlineColor="#2F80ED"
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text variant="labelMedium" style={styles.label}>
                  {t("auth.password")}
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  outlineColor="rgba(47, 128, 237, 0.25)"
                  activeOutlineColor="#2F80ED"
                  right={
                    <TextInput.Icon
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  style={styles.input}
                  contentStyle={styles.inputContent}
                />
              </View>

              {/* Language switcher + Forgot Password on same row */}
              <View style={styles.actionsRow}>
                <View style={styles.languageRow}>
                  <Button
                    mode={language === "ka" ? "contained" : "outlined"}
                    compact
                    onPress={() => setLanguage("ka")}
                    style={styles.langButton}
                  >
                    ქართული
                  </Button>
                  <Button
                    mode={language === "en" ? "contained" : "outlined"}
                    compact
                    onPress={() => setLanguage("en")}
                    style={styles.langButton}
                  >
                    English
                  </Button>
                </View>

                <Button
                  mode="text"
                  onPress={() => {
                    // TODO: Implement forgot password
                  }}
                  labelStyle={styles.forgotPasswordText}
                  compact
                >
                  {t("auth.forgotPassword")}
                </Button>
              </View>

              {/* Sign In Button */}
              <Button
                mode="contained"
                onPress={handleSignIn}
                style={styles.signInButton}
                labelStyle={styles.signInButtonText}
                contentStyle={styles.signInButtonContent}
                loading={loading}
                disabled={loading}
              >
                {t("auth.signIn")}
              </Button>

              {!!error && (
                <View style={styles.errorBox}>
                  <Text variant="bodySmall" style={styles.demoText}>
                    {error}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 20;
const INPUT_RADIUS = 12;
const BUTTON_RADIUS = 14;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: isTablet ? 440 : 360,
    backgroundColor: "#FFFFFF",
    borderRadius: CARD_RADIUS,
    padding: isTablet ? 44 : 36,
    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(47, 128, 237, 0.08)",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  logoText: {
    fontSize: 36,
    color: "#FFFFFF",
  },
  welcomeText: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 24,
    marginBottom: 6,
    color: "#1A1A1A",
    letterSpacing: 0.3,
  },
  subtitleText: {
    textAlign: "center",
    fontSize: 15,
    color: "#64748B",
    marginBottom: 28,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    marginBottom: 6,
    color: "#334155",
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderRadius: INPUT_RADIUS,
  },
  inputContent: {
    backgroundColor: "#F8FAFC",
    paddingVertical: 4,
  },
  languageRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  langButton: {
    minWidth: 88,
    borderRadius: 10,
  },
  forgotPasswordText: {
    color: "#2F80ED",
    fontSize: 14,
    fontWeight: "600",
  },
  signInButton: {
    backgroundColor: "#2F80ED",
    borderRadius: BUTTON_RADIUS,
    marginBottom: 12,
    shadowColor: "#2F80ED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  signInButtonContent: {
    paddingVertical: 10,
  },
  errorBox: {
    backgroundColor: "rgba(211, 47, 47, 0.08)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  demoText: {
    textAlign: "center",
    color: "#B91C1C",
    fontSize: 13,
    fontWeight: "500",
  },
});

