import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BeanCard } from '@/components/beans';
import FilterChip from '@/components/filter/FilterChip';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  useBeanListFilter,
} from '@/hooks/useBeanListFilter';
import { useUserBeans } from '@/hooks/useBeans';
import type { Bean } from '@/types/bean';

export default function BeansScreen() {
  const router = useRouter();
  const { track } = useAnalytics();
  const { data: beans = [], isLoading } = useUserBeans();
  const {
    sortBy,
    setSortBy,
    statusFilter,
    toggleStatusFilter,
    sortedBeans,
    isFiltered,
  } = useBeanListFilter(beans);

  const renderBeanItem = useCallback(
    ({ item }: { item: Bean }) => <BeanCard bean={item} />,
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 원두</Text>
        {isLoading ? (
          <View style={styles.addButtonPlaceholder} />
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.addButton}
            onPress={() => {
              track('bean_add_started', {});
              router.push('/beans/add');
            }}
          >
            <Ionicons color="#FFFFFF" name="add" size={24} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#8B4513" size="large" />
          <Text style={styles.loadingText}>원두를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          {/* Sort & Filter Bar */}
          <ScrollView
            style={styles.filterScroll}
            contentContainerStyle={styles.filterScrollContent}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                isSelected={sortBy === option.value}
                key={option.value}
                label={option.label}
                onPress={() => setSortBy(option.value)}
              />
            ))}
            <View style={styles.divider} />
            {STATUS_FILTER_OPTIONS.map((option) => (
              <FilterChip
                isSelected={statusFilter === option.value}
                key={option.value}
                label={option.label}
                onPress={() => toggleStatusFilter(option.value)}
              />
            ))}
          </ScrollView>

          <FlatList
            ItemSeparatorComponent={BeanListSeparator}
            ListEmptyComponent={
              <BeanListEmpty isFiltered={isFiltered} />
            }
            contentContainerStyle={styles.listContent}
            data={sortedBeans}
            keyExtractor={(item) => item.id}
            renderItem={renderBeanItem}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </SafeAreaView>
  );
}

const BeanListSeparator = () => <View style={styles.separator} />;

const BeanListEmpty = ({ isFiltered }: { isFiltered: boolean }) => (
  <View style={styles.emptyContainer}>
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
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  addButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  filterScroll: {
    flexGrow: 0,
  },
  filterScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#ddd',
  },
  listContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
  },
});
