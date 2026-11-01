import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimerControlsProps {
  isRunning: boolean;
  isCompleted: boolean;
  onToggleTimer: () => void;
  onReset: () => void;
}

const getToggleContent = (isRunning: boolean, isCompleted: boolean) => {
  if (isRunning) {
    return { icon: 'pause', label: '일시정지' } as const;
  }
  if (isCompleted) {
    return { icon: 'reload', label: '다시 시작' } as const;
  }
  return { icon: 'play', label: '시작' } as const;
};

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  isCompleted,
  onToggleTimer,
  onReset,
}) => {
  const toggleContent = getToggleContent(isRunning, isCompleted);

  return (
    <View style={styles.controlsContainer}>
      {isCompleted && (
        <View style={styles.completedBanner}>
          <Ionicons color="#2E7D32" name="checkmark-circle" size={20} />
          <Text style={styles.completedText}>추출 완료! 맛있게 즐기세요</Text>
        </View>
      )}
      <View style={styles.mainControls}>
        <TouchableOpacity
          onPress={onToggleTimer}
          style={[
            styles.timerButton,
            isRunning ? styles.timerButtonRunning : styles.timerButtonPaused,
          ]}
        >
          <Ionicons color="white" name={toggleContent.icon} size={32} />
          <Text style={styles.timerButtonText}>{toggleContent.label}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onReset} style={styles.resetButton}>
          <Ionicons color="#666" name="refresh" size={24} />
          <Text style={styles.resetButtonText}>리셋</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    paddingHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  completedText: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: '600',
  },
  mainControls: {
    flexDirection: 'row',
    gap: 16,
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  timerButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerButtonRunning: {
    backgroundColor: '#F44336',
  },
  timerButtonPaused: {
    backgroundColor: '#A0522D',
  },
  timerButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
});
