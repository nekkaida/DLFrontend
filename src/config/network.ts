import Constants from "expo-constants";
import { Platform } from "react-native";

/**
 * Get the backend base URL for the current environment
 * Handles different scenarios: Expo Go, development builds, production
 * 
 * IMPORTANT: In development, we use nginx (port 82) as an API gateway
 * instead of connecting directly to the backend (port 3001).
 * This provides a consistent architecture between dev and production.
 */
export function getBackendBaseURL(): string {
  // Production or specific environment override
  if (__DEV__ === false) {
    // In production, use the production URL
    return (
      process.env.EXPO_PUBLIC_API_URL || "https://staging.appdevelopers.my"
    );
  }

  // Development environment
  // Use nginx port (82) instead of direct backend port (3001)
  // This provides consistent routing and better matches production setup
  const nginxPort = "82";

  // If explicitly set in environment
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // For Expo Go and development
  if (Platform.OS === "web") {
    return `http://localhost:${nginxPort}`;
  }

  // For mobile devices in development
  // Try to get the IP from Expo's manifest
  const expoIP = Constants.expoConfig?.hostUri?.split(":")[0];

  // If Expo provides a LAN IP (not localhost/127.0.0.1), use it with nginx port
  if (expoIP && expoIP !== "localhost" && expoIP !== "127.0.0.1") {
    return `http://${expoIP}:${nginxPort}`;
  }

  // Handle emulators/simulators
  if (Platform.OS === "android") {
    // Android emulator maps host loopback to 10.0.2.2
    return `http://10.0.2.2:${nginxPort}`;
  }

  // iOS simulator can use localhost
  return `http://localhost:${nginxPort}`;
}

/**
 * Log the current network configuration for debugging
 */
export function logNetworkConfig(): void {
  if (__DEV__) {
    const baseURL = getBackendBaseURL();
    console.log("🌐 Network Configuration:");
    console.log(`   Platform: ${Platform.OS}`);
    console.log(`   Base URL: ${baseURL}`);
    console.log(
      `   Expo Host URI: ${Constants.expoConfig?.hostUri || "Not available"}`
    );
    console.log(`   Environment: ${__DEV__ ? "Development" : "Production"}`);
  }
}
