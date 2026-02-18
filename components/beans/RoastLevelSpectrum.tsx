import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  ROAST_LEVELS,
  ROAST_LEVEL_CONFIG,
  type RoastLevel,
} from '@/types/bean';

interface RoastLevelSpectrumProps {
  activeLevel: RoastLevel | null;
}

export const RoastLevelSpectrum = memo(function RoastLevelSpectrum({
  activeLevel,
}: RoastLevelSpectrumProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {ROAST_LEVELS.map((level) => {
          const isActive = level === activeLevel;
          const config = ROAST_LEVEL_CONFIG[level];

          return (
            <View key={level} style={styles.dotWrapper}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: config.color,
                    opacity: isActive ? 1 : 0.2,
                    width: isActive ? 28 : 24,
                    height: isActive ? 28 : 24,
                    borderRadius: isActive ? 14 : 12,
                  },
                  isActive && styles.activeDot,
                ]}
              />
              {isActive && (
                <Text style={styles.activeLabel}>{config.label}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dotWrapper: {
    alignItems: 'center',
    gap: 6,
    minWidth: 48,
  },
  dot: {
    // dynamic styles applied inline
  },
  activeDot: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  activeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
