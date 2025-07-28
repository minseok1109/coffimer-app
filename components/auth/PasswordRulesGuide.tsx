import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  checkPasswordStrength,
  PASSWORD_RULES,
} from '@/lib/validation/authSchema';

interface PasswordRulesGuideProps {
  password?: string;
  showStrength?: boolean;
}

export function PasswordRulesGuide({
  password = '',
  showStrength = true,
}: PasswordRulesGuideProps) {
  const strength = checkPasswordStrength(password);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>비밀번호 규칙</Text>

      <View style={styles.rulesContainer}>
        {PASSWORD_RULES.DESCRIPTION.map((rule, index) => {
          const isValid = getValidationForRule(index, strength);

          return (
            <View key={index} style={styles.ruleItem}>
              <Ionicons
                color={isValid ? '#22c55e' : '#9ca3af'}
                name={isValid ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                style={styles.ruleIcon}
              />
              <Text style={[styles.ruleText, isValid && styles.validRuleText]}>
                {rule}
              </Text>
            </View>
          );
        })}
      </View>

      {showStrength && password.length > 0 && (
        <View style={styles.strengthContainer}>
          <Text style={styles.strengthLabel}>강도:</Text>
          <View style={styles.strengthBar}>
            {[...Array(4)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.strengthSegment,
                  index < strength.strength &&
                    styles[`strength${strength.level.replace('-', '')}`],
                ]}
              />
            ))}
          </View>
          <Text
            style={[
              styles.strengthText,
              styles[`strength${strength.level.replace('-', '')}Text`],
            ]}
          >
            {getStrengthText(strength.level)}
          </Text>
        </View>
      )}
    </View>
  );
}

function getValidationForRule(
  ruleIndex: number,
  strength: ReturnType<typeof checkPasswordStrength>
): boolean {
  switch (ruleIndex) {
    case 0: // 6자 이상
      return strength.length;
    case 1: // 영문자와 숫자
      return strength.hasLetter && strength.hasNumber;
    case 2: // 특수문자 (선택사항)
      return true; // 특수문자는 선택사항이므로 항상 true
    default:
      return false;
  }
}

function getStrengthText(level: string): string {
  switch (level) {
    case 'weak':
      return '약함';
    case 'medium':
      return '보통';
    case 'strong':
      return '강함';
    case 'verystrong':
      return '매우강함';
    default:
      return '약함';
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  rulesContainer: {
    gap: 6,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleIcon: {
    marginRight: 4,
  },
  ruleText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  validRuleText: {
    color: '#059669',
    fontWeight: '500',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  strengthLabel: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  strengthBar: {
    flexDirection: 'row',
    gap: 2,
    flex: 1,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    minWidth: 50,
  },
  strengthweak: {
    backgroundColor: '#ef4444',
  },
  strengthweakText: {
    color: '#ef4444',
  },
  strengthmedium: {
    backgroundColor: '#f59e0b',
  },
  strengthmediumText: {
    color: '#f59e0b',
  },
  strengthstrong: {
    backgroundColor: '#10b981',
  },
  strengthstrongText: {
    color: '#10b981',
  },
  strengthverystrong: {
    backgroundColor: '#059669',
  },
  strengthverystrongText: {
    color: '#059669',
  },
});
