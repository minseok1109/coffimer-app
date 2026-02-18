import { BeanCard } from '@/components/beans';
import FilterChip from '@/components/filter/FilterChip';
import {
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
  useBeanListFilter,
} from '@/hooks/useBeanListFilter';
import { useUserBeans } from '@/hooks/useBeans';
import { Pressable, ScrollView, Text, View } from '@/src/tw';
import type { Bean } from '@/types/bean';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BeansScreen() {
  const router = useRouter();
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
    <SafeAreaView className="flex-1 bg-[#F7F8FA]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pt-3 pb-1">
        <Text className="text-2xl font-bold text-[#1C1C1E]">내 원두</Text>
        {isLoading ? (
          <View className="w-10 h-10" />
        ) : (
          <Pressable
            className="w-10 h-10 rounded-full bg-[#8B4513] items-center justify-center"
            onPress={() => router.push('/beans/add')}
          >
            <Ionicons color="#FFFFFF" name="add" size={24} />
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator color="#8B4513" size="large" />
          <Text className="text-sm text-gray-500">원두를 불러오는 중...</Text>
        </View>
      ) : (
        <>
          {/* Sort & Filter Bar */}
          <ScrollView
            contentContainerStyle={{ alignItems: 'center' }}
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 pt-4"
          >
            {SORT_OPTIONS.map((option) => (
              <FilterChip
                isSelected={sortBy === option.value}
                key={option.value}
                label={option.label}
                onPress={() => setSortBy(option.value)}
              />
            ))}
            <View className="w-px h-6 bg-[#ddd] mx-2" />
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
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
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

const BeanListSeparator = () => <View className="h-3" />;

const BeanListEmpty = ({ isFiltered }: { isFiltered: boolean }) => (
  <View className="items-center pt-[60px] gap-2">
    <Ionicons
      color="#ccc"
      name={isFiltered ? 'search-outline' : 'bag-outline'}
      size={64}
    />
    <Text className="text-lg text-[#999] mt-2">
      {isFiltered
        ? '조건에 맞는 원두가 없습니다'
        : '아직 등록된 원두가 없습니다'}
    </Text>
    {!isFiltered && (
      <Text className="text-sm text-[#ccc]">
        원두를 등록하고 관리해보세요!
      </Text>
    )}
  </View>
);
