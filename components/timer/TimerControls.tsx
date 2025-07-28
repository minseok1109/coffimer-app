import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TimerControlsProps {
  isRunning: boolean;
  onToggleTimer: () => void;
  onReset: () => void;
}

export const TimerControls: React.FC<TimerControlsProps> = ({
  isRunning,
  onToggleTimer,
  onReset,
}) => {
  return (
    <View style={styles.controlsContainer}>
      <View style={styles.mainControls}>
        <TouchableOpacity
          onPress={onToggleTimer}
          style={[
            styles.timerButton,
            isRunning ? styles.timerButtonRunning : styles.timerButtonPaused,
          ]}
        >
          <Ionicons
            color="white"
            name={isRunning ? 'pause' : 'play'}
            size={32}
          />
          <Text style={styles.timerButtonText}>
            {isRunning ? '일시정지' : '시작'}
          </Text>
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
