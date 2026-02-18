import { RoasteryCard } from '@/components/roasteries';
import { useRoasteries } from '@/hooks/useRoasteries';
import type { Roastery } from '@/types/roastery';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RoasteriesScreen() {
  const { data: roasteries, isLoading } = useRoasteries();

  const renderRoasteryItem = ({ item }: { item: Roastery }) => (
    <RoasteryCard roastery={item} />
  );

  const renderEmpty = () => {
    if (isLoading) {
      return null;
    }
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>등록된 로스터리가 없습니다</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>로스터리</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#A56A49" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>로스터리</Text>
      </View>

      <FlatList
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        data={roasteries}
        keyExtractor={(item) => item.id}
        renderItem={renderRoasteryItem}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
