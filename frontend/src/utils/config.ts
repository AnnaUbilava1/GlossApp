// Get API URL from environment variable
// For web/browser: use localhost or the configured URL
// For mobile devices: use the local network IP (e.g., http://172.20.10.3:3000)
// Make sure EXPO_PUBLIC_API_URL is set correctly in your .env file or environment
let apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

// Clean up the URL - remove any malformed concatenations
// Handle cases where URL might be incorrectly set like "http://localhost:8081/172.20.10.3:3000"
if (apiUrl.includes("localhost") && apiUrl.match(/\d+\.\d+\.\d+\.\d+/)) {
  // Extract the IP address and port if present
  const ipMatch = apiUrl.match(/(\d+\.\d+\.\d+\.\d+):?(\d+)?/);
  if (ipMatch) {
    const ip = ipMatch[1];
    const port = ipMatch[2] || "3000";
    apiUrl = `http://${ip}:${port}`;
    console.warn(
      `⚠️  Detected malformed API URL. Using corrected URL: ${apiUrl}`
    );
  }
}

// Ensure URL doesn't have trailing slash
apiUrl = apiUrl.replace(/\/$/, "");

// Log the API URL being used (helpful for debugging)
if (process.env.NODE_ENV !== "production") {
  console.log(`🔗 API Base URL: ${apiUrl}`);
}

export const API_BASE_URL = apiUrl;


