import { useAuthContext } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { PostHogProvider } from "posthog-react-native";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function Index() {
  return (
    <PostHogProvider
      apiKey="phc_IfnW9hTL4UtPiUALycBoWcvBJ17zrD6QTZw3PTjMtxT"
      options={{
        host: "https://us.i.posthog.com",
      }}
    >
      <App />
    </PostHogProvider>
  );
}

const App = () => {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B4513" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});
