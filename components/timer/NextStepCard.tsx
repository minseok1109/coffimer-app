import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { NextStepInfo } from '@/types/timer';
import { formatTime } from '../../lib/timer/formatters';

interface NextStepCardProps {
  nextStepInfo: NextStepInfo;
}

export const NextStepCard: React.FC<NextStepCardProps> = ({ nextStepInfo }) => {
  return (
    <View style={styles.nextStepCard}>
      <View style={styles.nextStepHeader}>
        <Ionicons color="#D2691E" name="arrow-forward-circle" size={20} />
        <Text style={styles.nextStepLabel}>다음 단계</Text>
      </View>

      <Text style={styles.nextStepTitle}>{nextStepInfo.step.title}</Text>

      <View style={styles.nextStepDetails}>
        <View style={styles.nextWaterInfo}>
          <Ionicons color="#D2691E" name="water-outline" size={16} />
          <Text style={styles.nextWaterAmount}>
            {nextStepInfo.step.water}ml
          </Text>
        </View>
        <Text style={styles.nextStepTime}>
          {formatTime(nextStepInfo.step.time)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  nextStepCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#D2691E',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  nextStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  nextStepLabel: {
    fontSize: 14,
    color: '#D2691E',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  nextStepCounter: {
    fontSize: 12,
    color: '#D2691E',
    fontWeight: '600',
  },
  nextStepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nextStepDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextWaterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nextWaterAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  nextStepTime: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
});
