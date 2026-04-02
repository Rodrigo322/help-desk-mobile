import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { AppProviders } from "../src/components/app-providers";

export default function RootLayout() {
  return (
    <AppProviders>
      <StatusBar style="dark" />
      <Slot />
    </AppProviders>
  );
}

