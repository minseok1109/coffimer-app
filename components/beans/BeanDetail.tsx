import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { ROAST_LEVEL_CONFIG, type Bean } from '@/types/bean';
import { sortBeanImages } from '@/utils/beanImages';
import { calculateDegassingStatus } from '@/utils/degassingUtils';
import { CupNoteTag } from './CupNoteTag';
import { DegassingTimeline } from './DegassingTimeline';
import { RemainingBar } from './RemainingBar';


interface BeanDetailProps {
  bean: Bean;
}

export function BeanDetail({ bean }: BeanDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { width } = useWindowDimensions();
  const roastConfig = bean.roast_level
    ? ROAST_LEVEL_CONFIG[bean.roast_level]
    : null;
  const orderedImages = useMemo(() => sortBeanImages(bean.images), [bean.images]);
  const variety = bean.variety?.trim() ?? '';
  const processMethod = bean.process_method?.trim() ?? '';
  const notes = bean.notes?.trim() ?? '';
  const hasDegassingSetting = bean.degassing_days !== null;
  const isImmediateDrink = bean.degassing_days === 0;

  const formattedDate = bean.roast_date
    ? new Date(bean.roast_date).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const formattedPrice = bean.price
    ? bean.price.toLocaleString('ko-KR')
    : null;

  const degassingInfo = useMemo(
    () => calculateDegassingStatus(bean.roast_date, bean.degassing_days, bean.roast_level),
    [bean.roast_date, bean.degassing_days, bean.roast_level],
  );

  const degassingDetail = useMemo(() => {
    if (!degassingInfo) return null;

    const { status, daysFromRoast, degassingEnd, optimalEnd } = degassingInfo;

    const phases = [
      {
        icon: 'flame-outline' as const,
        label: '디게싱',
        range: `1~${degassingEnd}일`,
        active: status === 'degassing',
        color: '#FF6B35',
      },
      {
        icon: 'checkmark-circle-outline' as const,
        label: '최적기',
        range: `${degassingEnd}~${optimalEnd}일`,
        active: status === 'optimal',
        color: '#10B981',
      },
      {
        icon: 'trending-down-outline' as const,
        label: '신선도 저하',
        range: `${optimalEnd}일+`,
        active: status === 'past_prime',
        color: '#6B7280',
      },
    ];

    let message: string;
    if (status === 'degassing') {
      const remaining = degassingEnd - daysFromRoast;
      message = `최적의 맛까지 ${remaining}일 남았습니다`;
    } else if (status === 'optimal') {
      const remaining = optimalEnd - daysFromRoast;
      message = `지금이 최적기입니다! ${remaining}일 남았습니다`;
    } else {
      const pastDays = daysFromRoast - optimalEnd;
      message = `최적기가 ${pastDays}일 전에 지났습니다`;
    }

    return { phases, message };
  }, [degassingInfo]);

  const hasTimelineData = Boolean(degassingInfo && degassingDetail);
  const showDegassingSection = hasDegassingSetting || hasTimelineData;
  const showMissingRoastDateMessage =
    hasDegassingSetting && !isImmediateDrink && !hasTimelineData;

  return (
    <ScrollView
      contentInset={{ bottom: 100 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.scrollContent}
      scrollIndicatorInsets={{ bottom: 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={styles.heroContainer}>
        {orderedImages.length > 0 ? (
          <>
            <FlatList
              data={orderedImages}
              horizontal
              pagingEnabled
              keyExtractor={(item) => item.id}
              onMomentumScrollEnd={(event) => {
                const width = event.nativeEvent.layoutMeasurement.width;
                if (width <= 0) return;
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setActiveImageIndex(index);
              }}
              renderItem={({ item, index }) => (
                <Image
                  contentFit="cover"
                  source={{ uri: item.image_url }}
                  style={[styles.heroImage, { width }]}
                  testID={`bean-detail-image-${index}`}
                  transition={200}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
            <View style={styles.counterPill} testID="bean-detail-counter">
              <Text style={styles.counterText}>
                {activeImageIndex + 1}/{orderedImages.length}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons color="#A56A49" name="bag-handle" size={64} />
          </View>
        )}
        {roastConfig ? (
          <View style={styles.roastPill}>
            <View
              style={[styles.pillDot, { backgroundColor: roastConfig.color }]}
            />
            <Text style={styles.pillText}>{roastConfig.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Bean Info */}
      <View style={styles.section}>
        <Text style={styles.beanName}>{bean.name}</Text>
        {bean.roastery_name ? (
          <Text style={styles.roasteryName}>{bean.roastery_name}</Text>
        ) : null}

        <View style={styles.detailRows}>
          {formattedPrice ? (
            <View style={styles.detailRow}>
              <Ionicons color="#A56A49" name="pricetag-outline" size={18} />
              <Text style={styles.detailText}>{formattedPrice}원</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Ionicons color="#A56A49" name="scale-outline" size={18} />
            <Text style={styles.detailText}>{bean.weight_g}g</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons color="#A56A49" name="leaf-outline" size={18} />
            <Text style={styles.detailText}>
              {bean.bean_type === 'single_origin' ? '싱글 오리진' : '블렌드'}
            </Text>
          </View>
          {formattedDate ? (
            <View style={styles.detailRow}>
              <Ionicons color="#A56A49" name="calendar-outline" size={18} />
              <Text style={styles.detailText}>{formattedDate}</Text>
            </View>
          ) : null}
          {roastConfig ? (
            <View style={styles.detailRow}>
              <Ionicons color="#A56A49" name="flame-outline" size={18} />
              <Text style={styles.detailText}>{roastConfig.label} 로스팅</Text>
            </View>
          ) : null}
          {variety.length > 0 ? (
            <View style={styles.detailRow}>
              <Ionicons color="#A56A49" name="flower-outline" size={18} />
              <Text style={styles.detailText}>{variety}</Text>
            </View>
          ) : null}
          {processMethod.length > 0 ? (
            <View style={styles.detailRow}>
              <Ionicons color="#A56A49" name="water-outline" size={18} />
              <Text style={styles.detailText}>{processMethod}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Degassing Info */}
      {showDegassingSection ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>디게싱</Text>

          {hasDegassingSetting ? (
            <View style={[styles.detailRow, styles.degassingSettingRow]}>
              <Ionicons color="#A56A49" name="timer-outline" size={18} />
              <Text style={styles.detailText}>
                디게싱 기간 설정: {bean.degassing_days}일
              </Text>
            </View>
          ) : null}

          {hasTimelineData && degassingInfo && degassingDetail ? (
            <>
              {hasDegassingSetting ? <View style={styles.separator} /> : null}
              <DegassingTimeline degassingInfo={degassingInfo} />
              <View style={styles.separator} />
              <View style={styles.phaseRow}>
                {degassingDetail.phases.map((phase) => (
                  <View
                    key={phase.label}
                    style={[
                      styles.phaseItem,
                      phase.active && { backgroundColor: `${phase.color}10` },
                    ]}
                  >
                    <Ionicons
                      color={phase.active ? phase.color : '#9CA3AF'}
                      name={phase.icon}
                      size={20}
                    />
                    <Text
                      style={[
                        styles.phaseLabel,
                        phase.active && { color: phase.color, fontWeight: '700' },
                      ]}
                    >
                      {phase.label}
                    </Text>
                    <Text style={styles.phaseRange}>{phase.range}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.separator} />
              <View style={styles.messageRow}>
                <Ionicons color="#A56A49" name="information-circle-outline" size={18} />
                <Text style={styles.messageText}>{degassingDetail.message}</Text>
              </View>
            </>
          ) : null}

          {isImmediateDrink ? (
            <>
              {hasDegassingSetting ? <View style={styles.separator} /> : null}
              <View style={styles.messageRow}>
                <Ionicons color="#A56A49" name="cafe-outline" size={18} />
                <Text style={styles.messageText}>
                  디게싱 0일 설정으로 즉시 음용 가능 상태입니다.
                </Text>
              </View>
            </>
          ) : null}

          {showMissingRoastDateMessage ? (
            <>
              {hasDegassingSetting ? <View style={styles.separator} /> : null}
              <View style={styles.messageRow}>
                <Ionicons color="#A56A49" name="information-circle-outline" size={18} />
                <Text style={styles.messageText}>
                  로스팅 날짜를 입력하면 디게싱 타임라인이 표시됩니다.
                </Text>
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {/* Cup Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>컵노트</Text>
        {bean.cup_notes.length > 0 ? (
          <View style={styles.cupNotesWrap}>
            {bean.cup_notes.map((note) => (
              <CupNoteTag key={note} note={note} />
            ))}
          </View>
        ) : (
          <Text style={styles.emptyNotes}>등록된 컵노트가 없습니다</Text>
        )}
      </View>

      {/* Notes */}
      {notes.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메모</Text>
          <Text selectable style={styles.notesText}>
            {notes}
          </Text>
        </View>
      ) : null}

      {/* Remaining */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>잔여량</Text>
        <RemainingBar
          remaining={bean.remaining_g}
          size="large"
          total={bean.weight_g}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 24,
  },
  heroContainer: {
    position: 'relative',
    height: 256,
  },
  heroImage: {
    height: '100%',
    backgroundColor: '#E5E7EB',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roastPill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  counterPill: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pillDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  beanName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  roasteryName: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  detailRows: {
    marginTop: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 15,
    color: '#4B5563',
  },
  degassingSettingRow: {
    marginBottom: 12,
  },
  cupNotesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  emptyNotes: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 16,
  },
  phaseRow: {
    flexDirection: 'row',
    gap: 8,
  },
  phaseItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  phaseRange: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  messageText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
  },
  notesText: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
  },
});
