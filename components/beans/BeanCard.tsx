import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { ROAST_LEVEL_CONFIG, type Bean } from '@/types/bean';
import { calculateDegassingStatus } from '@/utils/degassingUtils';
import { getPrimaryBeanImage } from '@/utils/beanImages';
import { DegassingTimeline } from './DegassingTimeline';

interface BeanCardProps {
  bean: Bean;
}

export const BeanCard = memo(function BeanCard({ bean }: BeanCardProps) {
  const router = useRouter();
  const isExhausted = bean.remaining_g <= 0;
  const primaryImage = useMemo(() => getPrimaryBeanImage(bean.images), [bean.images]);

  const roastConfig = bean.roast_level
    ? ROAST_LEVEL_CONFIG[bean.roast_level]
    : null;

  const formattedDate = bean.roast_date
    ? new Date(bean.roast_date).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    : null;

  const degassingInfo = useMemo(
    () => calculateDegassingStatus(bean.roast_date, bean.degassing_days, bean.roast_level),
    [bean.roast_date, bean.degassing_days, bean.roast_level],
  );

  return (
    <Pressable
      onPress={() => router.push(`/beans/${bean.id}`)}
      style={({ pressed }) => [
        styles.card,
        isExhausted && styles.exhaustedCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {bean.name}
          </Text>
          {isExhausted && (
            <View style={styles.exhaustedBadge}>
              <Text style={styles.exhaustedText}>소진됨</Text>
            </View>
          )}
        </View>

        {bean.roastery_name && (
          <Text numberOfLines={1} style={styles.roastery}>
            {bean.roastery_name}
          </Text>
        )}

        <View style={styles.metaRow}>
          {roastConfig && (
            <>
              <View
                style={[
                  styles.roastDot,
                  { backgroundColor: roastConfig.color },
                ]}
              />
              <Text style={styles.metaText}>{roastConfig.label}</Text>
            </>
          )}
          {formattedDate && (
            <Text style={styles.dateText}>
              {roastConfig ? ' · ' : ''}
              {formattedDate}
            </Text>
          )}
        </View>

        {degassingInfo && (
          <View style={styles.timelineContainer}>
            <DegassingTimeline degassingInfo={degassingInfo} />
          </View>
        )}

        <Text style={styles.remainingText}>
          잔여량 {bean.remaining_g}g/{bean.weight_g}g
        </Text>
      </View>

      {primaryImage ? (
        <Image
          source={{ uri: primaryImage.image_url }}
          style={styles.image}
          testID="bean-card-image"
        />
      ) : (
        <View style={styles.imagePlaceholder} testID="bean-card-placeholder">
          <Ionicons color="#A56A49" name="bag-outline" size={32} />
        </View>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exhaustedCard: {
    opacity: 0.65,
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
    flexShrink: 1,
  },
  exhaustedBadge: {
    backgroundColor: 'rgba(107,114,128,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  exhaustedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  roastery: {
    fontSize: 14,
    color: '#6B7280',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  roastDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  timelineContainer: {
    marginTop: 6,
  },
  remainingText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
