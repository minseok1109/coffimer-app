import { Alert, Linking } from 'react-native';

export const SUPPORT_EMAIL = 'minseok32@gmail.com';

// openURL rejects when no mail app handles mailto: (e.g. Mail was deleted),
// so surface the address instead of failing silently.
export const openSupportEmail = async () => {
  try {
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  } catch {
    Alert.alert(
      '메일 앱을 열 수 없습니다',
      `${SUPPORT_EMAIL} 으로 문의해주세요.`
    );
  }
};
