import { ROAST_LEVEL_CONFIG, type Bean } from '@/types/bean';
import { sortBeanImages } from '@/utils/beanImages';
import { calculateDegassingStatus } from '@/utils/degassingUtils';
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
import { CupNoteTag } from './CupNoteTag';
import { RemainingBar } from './RemainingBar';

interface InfoItem {
  label: string;
  value: string;
}

interface BeanDetailProps {
  bean: Bean;
}

const formatKoreanDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const buildInfoItems = (bean: Bean): InfoItem[] => {
  const roastConfig = bean.roast_level
    ? ROAST_LEVEL_CONFIG[bean.roast_level]
    : null;
  const variety = bean.variety?.trim() ?? '';
  const processMethod = bean.process_method?.trim() ?? '';
  const formattedPrice = bean.price
    ? bean.price.toLocaleString('ko-KR')
    : null;

  return [
    { label: '용량', value: `${bean.weight_g}g` },
    formatKoreanDate(bean.roast_date)
      ? { label: '로스팅 날짜', value: formatKoreanDate(bean.roast_date) as string }
      : undefined,
    formatKoreanDate(bean.opened_date)
      ? { label: '개봉일', value: formatKoreanDate(bean.opened_date) as string }
      : undefined,
    { label: '원두 유형', value: bean.bean_type === 'single_origin' ? '싱글 오리진' : '블렌드' },
    roastConfig ? { label: '배전도', value: `${roastConfig.label} 로스팅` } : undefined,
    variety.length > 0 ? { label: '품종', value: variety } : undefined,
    processMethod.length > 0 ? { label: '가공 방식', value: processMethod } : undefined,
    formattedPrice ? { label: '가격', value: `${formattedPrice}원` } : undefined,
  ].filter((item): item is InfoItem => item !== undefined);
};

interface DegassingMessageProps {
  icon: string;
  message: string;
}

function DegassingMessage({ icon, message }: DegassingMessageProps) {
  return (
    <>
      <View style={styles.separator} />
      <View style={styles.messageRow}>
        <Ionicons color="#A56A49" name={icon as 'cafe-outline'} size={18} />
        <Text style={styles.messageText}>{message}</Text>
      </View>
    </>
  );
}

export function BeanDetail({ bean }: BeanDetailProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const { width } = useWindowDimensions();
  const roastConfig = bean.roast_level
    ? ROAST_LEVEL_CONFIG[bean.roast_level]
    : null;
  const orderedImages = useMemo(() => sortBeanImages(bean.images), [bean.images]);
  const notes = bean.notes?.trim() ?? '';
  const infoItems = buildInfoItems(bean);
  const hasDegassingSetting = bean.degassing_days !== null;
  const isImmediateDrink = bean.degassing_days === 0;

  const degassingInfo = useMemo(
    () => calculateDegassingStatus(bean.roast_date, bean.degassing_days),
    [bean.roast_date, bean.degassing_days],
  );

  const showMissingRoastDateMessage =
    hasDegassingSetting && !isImmediateDrink && !degassingInfo;

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
                const layoutWidth = event.nativeEvent.layoutMeasurement.width;
                if (layoutWidth <= 0) return;
                const index = Math.round(event.nativeEvent.contentOffset.x / layoutWidth);
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

        <View style={styles.infoTable}>
          {infoItems.map((item, index) => (
            <View key={item.label}>
              {index > 0 ? <View style={styles.rowDivider} /> : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Degassing Info */}
      {hasDegassingSetting ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>디게싱</Text>

          <View style={styles.detailRow}>
            <Ionicons color="#A56A49" name="timer-outline" size={18} />
            <Text style={styles.detailText}>
              디게싱 기간 설정: {bean.degassing_days}일
            </Text>
          </View>

          {degassingInfo ? (
            <DegassingMessage
              icon={degassingInfo.status === 'degassing' ? 'information-circle-outline' : 'checkmark-circle-outline'}
              message={
                degassingInfo.status === 'degassing'
                  ? `디게싱 완료까지 ${degassingInfo.remainingDays}일 남았습니다`
                  : '디게싱이 완료되었습니다'
              }
            />
          ) : null}

          {isImmediateDrink ? (
            <DegassingMessage
              icon="cafe-outline"
              message="디게싱 0일 설정으로 즉시 음용 가능 상태입니다."
            />
          ) : null}

          {showMissingRoastDateMessage ? (
            <DegassingMessage
              icon="information-circle-outline"
              message="로스팅 날짜를 입력하면 디게싱 타임라인이 표시됩니다."
            />
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
  infoTable: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
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
