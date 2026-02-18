import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DegassingInfo, DegassingStatus } from '@/utils/degassingUtils';

interface DegassingTimelineProps {
  degassingInfo: DegassingInfo;
}

const STATUS_COLORS: Record<DegassingStatus, string> = {
  degassing: '#FF6B35',
  optimal: '#10B981',
  past_prime: '#6B7280',
} as const;

export const DegassingTimeline = memo(function DegassingTimeline({
  degassingInfo,
}: DegassingTimelineProps) {
  const { status, label, daysFromRoast, degassingEnd, optimalEnd, progress } = degassingInfo;
  const dotColor = STATUS_COLORS[status];

  const hasValidWindow = optimalEnd > 0;
  const degassingRatio = hasValidWindow
    ? Math.min(Math.max(degassingEnd / optimalEnd, 0), 1)
    : 0;
  const optimalRatio = 1 - degassingRatio;
  const dotPosition = hasValidWindow ? Math.min(Math.max(progress, 0), 1) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.statusLabel, { color: dotColor }]}>{label}</Text>
        <Text style={styles.daysText}>D+{daysFromRoast}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barSegment,
              {
                flex: degassingRatio,
                backgroundColor: '#FF6B35',
                borderTopLeftRadius: 2,
                borderBottomLeftRadius: 2,
              },
            ]}
          />
          <View
            style={[
              styles.barSegment,
              {
                flex: optimalRatio,
                backgroundColor: '#10B981',
                borderTopRightRadius: 2,
                borderBottomRightRadius: 2,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.dot,
            {
              left: `${dotPosition * 100}%`,
              backgroundColor: dotColor,
            },
          ]}
        />
      </View>
    </View>
  );
});

const DOT_SIZE = 8;

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  daysText: {
    fontSize: 11,
    color: '#999',
  },
  barContainer: {
    height: DOT_SIZE,
    justifyContent: 'center',
  },
  barTrack: {
    height: 4,
    borderRadius: 2,
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    marginLeft: -(DOT_SIZE / 2),
  },
});
