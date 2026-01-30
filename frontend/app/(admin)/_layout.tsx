import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../../src/context/AuthContext";

export default function AdminLayout() {
  const { user, token } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait until the router has resolved initial segments
    if (!segments || segments.length === 0) {
      return;
    }

    // If not authenticated, redirect to login
    if (!token || !user) {
      router.replace("/(auth)/login");
      return;
    }

    // If authenticated but not admin, redirect to dashboard
    if (user.role !== "admin") {
      router.replace("/(app)/dashboard");
      return;
    }
  }, [segments, token, user?.role, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}

