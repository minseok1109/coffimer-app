import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ConfidenceLevel = 'high' | 'low' | 'none';

interface ConfidenceBadgeProps {
  confidence: number | null;
}

const BADGE_CONFIG: Record<
  ConfidenceLevel,
  {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    color: string;
    bg: string;
  }
> = {
  high: {
    icon: 'checkmark-circle',
    label: 'AI 추출',
    color: '#34C759',
    bg: 'rgba(52,199,89,0.1)',
  },
  low: {
    icon: 'alert-circle',
    label: '확인필요',
    color: '#FFB800',
    bg: 'rgba(255,184,0,0.1)',
  },
  none: {
    icon: 'create-outline',
    label: '직접 입력',
    color: '#6B7280',
    bg: 'rgba(107,114,128,0.1)',
  },
};

function getConfidenceLevel(confidence: number | null): ConfidenceLevel {
  if (confidence === null || confidence === 0) return 'none';
  if (confidence >= 0.7) return 'high';
  return 'low';
}

export const ConfidenceBadge = memo(function ConfidenceBadge({
  confidence,
}: ConfidenceBadgeProps) {
  const level = getConfidenceLevel(confidence);
  const config = BADGE_CONFIG[level];

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Ionicons color={config.color} name={config.icon} size={14} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
