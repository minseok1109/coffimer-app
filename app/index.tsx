import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuthContext } from '@/contexts/AuthContext';

export default function Index() {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#8B4513" size="large" />
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
