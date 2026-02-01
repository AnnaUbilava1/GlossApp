import { Stack } from "expo-router";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../src/context/AuthContext";
import { LanguageProvider } from "../src/context/LanguageContext";
import { lightTheme } from "../src/utils/theme";
import { useProtectedRoute } from "../src/hooks/useProtectedRoute";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{this.state.error?.message}</Text>
          <Text style={styles.errorStack}>{this.state.error?.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function RootNavigation() {
  // Central auth + role guard
  useProtectedRoute();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: lightTheme.colors.background },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <PaperProvider theme={lightTheme}>
          <LanguageProvider>
            <AuthProvider>
              <RootNavigation />
            </AuthProvider>
          </LanguageProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#D32F2F",
  },
  errorText: {
    fontSize: 16,
    marginBottom: 10,
    color: "#212121",
    textAlign: "center",
  },
  errorStack: {
    fontSize: 12,
    color: "#757575",
    marginTop: 10,
    fontFamily: "monospace",
  },
});
