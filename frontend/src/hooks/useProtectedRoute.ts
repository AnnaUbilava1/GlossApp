import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../context/AuthContext";

export function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const { token, user } = useAuth();

  useEffect(() => {
    // Wait until the router has resolved initial segments
    if (!segments || !segments[0]) {
      return;
    }

    // segments example: ["(auth)","index"] or ["(app)","dashboard"]
    const group = segments[0] as string | undefined;
    const inAuthGroup = group === "(auth)";
    const inAdminGroup = group === "(admin)";

    // Not logged in: send everywhere except auth to login
    if (!token) {
      if (!inAuthGroup) {
        router.replace("/(auth)");
      }
      return;
    }

    // Logged in, but on auth screens: redirect based on role
    if (inAuthGroup) {
      const role = user?.role || "staff";
      if (role === "admin") {
        router.replace("/(app)/dashboard");
      } else {
        router.replace("/(app)");
      }
      return;
    }

    // Logged in staff trying to access admin routes → send to app
    if (inAdminGroup && user?.role !== "admin") {
      router.replace("/(app)");
    }
  }, [segments, token, user?.role, router]);
}

