import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useUserBeans } from '@/hooks/useBeans';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BeanCard } from '@/components/beans';
import FilterChip from '@/components/filter/FilterChip';
import type { Bean } from '@/types/bean';

type SortOption = 'latest' | 'remaining' | 'roast_date';
type StatusFilter = 'active' | 'exhausted';

export default function BeansScreen() {
  const router = useRouter();
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter | null>(null);
  const { data: beans = [], isLoading } = useUserBeans();

  const sortedBeans = useMemo(() => {
    const filtered = beans.filter((bean) => {
      if (statusFilter === 'active') return bean.remaining_g > 0;
      if (statusFilter === 'exhausted') return bean.remaining_g <= 0;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'remaining') return b.remaining_g - a.remaining_g;
      if (sortBy === 'roast_date') {
        if (!a.roast_date) return 1;
        if (!b.roast_date) return -1;
        return (
          new Date(b.roast_date).getTime() - new Date(a.roast_date).getTime()
        );
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [beans, sortBy, statusFilter]);

  const toggleStatusFilter = useCallback(
    (filter: StatusFilter) => {
      setStatusFilter((prev) => (prev === filter ? null : filter));
    },
    [],
  );

  const renderBeanItem = useCallback(
    ({ item }: { item: Bean }) => <BeanCard bean={item} />,
    [],
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    const isFiltered = statusFilter !== null;
    return (
      <View style={styles.emptyState}>
        <Ionicons
          color="#ccc"
          name={isFiltered ? 'search-outline' : 'bag-outline'}
          size={64}
        />
        <Text style={styles.emptyTitle}>
          {isFiltered
            ? '조건에 맞는 원두가 없습니다'
            : '아직 등록된 원두가 없습니다'}
        </Text>
        {!isFiltered && (
          <Text style={styles.emptySubtitle}>
            원두를 등록하고 관리해보세요!
          </Text>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>내 원두</Text>
          <View style={styles.addButtonPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#8B4513" size="large" />
          <Text style={styles.loadingText}>원두를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 원두</Text>
        <Pressable
          onPress={() => router.push('/beans/add')}
          style={styles.addButton}
        >
          <Ionicons color="#FFFFFF" name="add" size={24} />
        </Pressable>
      </View>

      {/* Sort & Filter Bar */}
      <ScrollView
        contentContainerStyle={styles.filterBar}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <FilterChip
          isSelected={sortBy === 'latest'}
          label="최신순"
          onPress={() => setSortBy('latest')}
        />
        <FilterChip
          isSelected={sortBy === 'remaining'}
          label="잔여량순"
          onPress={() => setSortBy('remaining')}
        />
        <FilterChip
          isSelected={sortBy === 'roast_date'}
          label="로스팅일순"
          onPress={() => setSortBy('roast_date')}
        />
        <View style={styles.filterDivider} />
        <FilterChip
          isSelected={statusFilter === 'active'}
          label="보유 중"
          onPress={() => toggleStatusFilter('active')}
        />
        <FilterChip
          isSelected={statusFilter === 'exhausted'}
          label="소진됨"
          onPress={() => toggleStatusFilter('exhausted')}
        />
      </ScrollView>

      <FlatList
        ItemSeparatorComponent={BeanListSeparator}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        data={sortedBeans}
        keyExtractor={(item) => item.id}
        renderItem={renderBeanItem}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const BeanListSeparator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  filterBar: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  filterDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
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
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#999',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
  },
});
