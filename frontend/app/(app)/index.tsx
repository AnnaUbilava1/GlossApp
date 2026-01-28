import { Redirect } from "expo-router";

export default function AppIndex() {
  // Redirect to new-record as the default screen
  return <Redirect href="/(app)/new-record" />;
}

