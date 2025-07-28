import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type MessageType = 'error' | 'success' | 'warning' | 'info';

interface ErrorMessageProps {
  message: string;
  type?: MessageType;
  showIcon?: boolean;
}

const MESSAGE_CONFIG: Record<
  MessageType,
  {
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
  }
> = {
  error: {
    icon: 'alert-circle',
    color: '#dc3545',
  },
  success: {
    icon: 'checkmark-circle',
    color: '#22c55e',
  },
  warning: {
    icon: 'warning',
    color: '#f59e0b',
  },
  info: {
    icon: 'information-circle',
    color: '#3b82f6',
  },
};

export function ErrorMessage({
  message,
  type = 'error',
  showIcon = true,
}: ErrorMessageProps) {
  const config = MESSAGE_CONFIG[type];

  if (!message) return null;

  return (
    <View style={styles.container}>
      {showIcon && (
        <Ionicons
          color={config.color}
          name={config.icon}
          size={14}
          style={styles.icon}
        />
      )}
      <Text style={[styles.message, { color: config.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
    gap: 6,
  },
  icon: {
    marginTop: 1, // 텍스트와 수직 정렬 조정
  },
  message: {
    fontSize: 12,
    fontWeight: '400',
    flex: 1,
    lineHeight: 16,
  },
});
