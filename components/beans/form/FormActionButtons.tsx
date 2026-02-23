import { Text, TouchableOpacity, View } from 'react-native';
import { formStyles as styles } from './styles';

interface FormActionButtonsProps {
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel: string;
  loadingLabel: string;
}

export function FormActionButtons({
  isLoading,
  onCancel,
  onSubmit,
  submitLabel,
  loadingLabel,
}: FormActionButtonsProps) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity disabled={isLoading} onPress={onCancel} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>취소</Text>
      </TouchableOpacity>
      <TouchableOpacity
        disabled={isLoading}
        onPress={onSubmit}
        style={[styles.submitButton, isLoading && styles.disabledButton]}
      >
        <Text style={styles.submitButtonText}>
          {isLoading ? loadingLabel : submitLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
