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

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

export default function LoginScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = () => {
    // TODO: Implement authentication logic
    // For now, check if email contains 'admin' to determine role
    const isAdmin = email.toLowerCase().includes('admin');
    if (isAdmin) {
      router.replace("/(admin)");
    } else {
      router.replace("/(app)");
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
              Welcome Back
            </Text>
            <Text variant="bodyMedium" style={styles.subtitleText}>
              Sign in to your car wash management account
            </Text>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                <Text variant="labelMedium" style={styles.label}>
                  Email
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="name@example.com"
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
                  Password
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder="Enter your password"
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
                  Forgot password?
                </Button>
              </View>

              {/* Sign In Button */}
              <Button
                mode="contained"
                onPress={handleSignIn}
                style={styles.signInButton}
                labelStyle={styles.signInButtonText}
                contentStyle={styles.signInButtonContent}
              >
                Sign In
              </Button>

              {/* Demo Instruction */}
              <Text variant="bodySmall" style={styles.demoText}>
                Demo: Use any email (include 'admin' for admin role)
              </Text>
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
    marginBottom: 24,
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

