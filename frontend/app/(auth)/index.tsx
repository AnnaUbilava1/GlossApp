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

            {/* Language switcher */}
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

              {/* Forgot Password Link */}
              <View style={styles.forgotPasswordContainer}>
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
                <Text variant="bodySmall" style={[styles.demoText, { color: "#D32F2F" }]}>
                  {error}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: isTablet ? 450 : 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: isTablet ? 40 : 32,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  languageRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  langButton: {
    minWidth: 90,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#2F80ED",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 32,
    color: "#FFFFFF",
  },
  welcomeText: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 8,
    color: "#212121",
  },
  subtitleText: {
    textAlign: "center",
    color: "#757575",
    marginBottom: 32,
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 8,
    color: "#424242",
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FAFAFA",
  },
  inputContent: {
    backgroundColor: "#FAFAFA",
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#2F80ED",
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: "#2F80ED",
    borderRadius: 8,
    marginBottom: 16,
  },
  signInButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  signInButtonContent: {
    paddingVertical: 8,
  },
  demoText: {
    textAlign: "center",
    color: "#9E9E9E",
    fontSize: 12,
  },
});

