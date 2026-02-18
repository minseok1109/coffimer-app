import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface RemainingBarProps {
  remaining: number;
  total: number;
  size?: 'small' | 'large';
}

function getBarColor(percentage: number): string {
  if (percentage >= 70) return '#8B4513';
  if (percentage >= 30) return '#D2691E';
  if (percentage > 0) return '#FF6B35';
  return '#E0E0E0';
}

export const RemainingBar = memo(function RemainingBar({
  remaining,
  total,
  size = 'small',
}: RemainingBarProps) {
  const percentage = total > 0 ? (remaining / total) * 100 : 0;
  const barColor = getBarColor(percentage);
  const isLarge = size === 'large';

  return (
    <View style={styles.container}>
      {isLarge ? (
        <>
          <View style={styles.largeHeader}>
            <Text style={styles.largeNumber}>{remaining}</Text>
            <Text style={styles.largeSuffix}>/ {total}g</Text>
          </View>
          <View style={styles.largeBarBg}>
            <View
              style={[
                styles.largeBarFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
          <View style={styles.largeFooter}>
            <Text style={styles.footerText}>
              {Math.round(percentage)}% 남음
            </Text>
            <Text style={styles.footerText}>{total - remaining}g 사용</Text>
          </View>
        </>
      ) : (
        <>
          <View style={styles.smallHeader}>
            <Text style={styles.smallLabel}>잔여량</Text>
            <Text style={styles.smallValue}>
              {remaining}g/{total}g
            </Text>
          </View>
          <View style={styles.smallBarBg}>
            <View
              style={[
                styles.smallBarFill,
                {
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: barColor,
                },
              ]}
            />
          </View>
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  smallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  smallLabel: {
    fontSize: 12,
    color: '#999',
  },
  smallValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  smallBarBg: {
    height: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  smallBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  largeHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  largeNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
  },
  largeSuffix: {
    fontSize: 16,
    color: '#6B7280',
  },
  largeBarBg: {
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    overflow: 'hidden',
    marginTop: 8,
  },
  largeBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  largeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
