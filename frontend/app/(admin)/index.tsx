import { Redirect } from "expo-router";

export default function AdminIndex() {
  // Redirect to vehicles as default admin screen
  return <Redirect href="/(admin)/vehicles" />;
}

