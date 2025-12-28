import { Redirect } from "expo-router";

export default function AdminIndex() {
  // Redirect to companies as default admin screen
  return <Redirect href="/(admin)/companies" />;
}

