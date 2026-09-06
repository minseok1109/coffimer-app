import { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelDebugNotification, scheduleDebugNotification } from '@/lib/notifications/debug';
import { BeanAPI } from '@/lib/api/beans';
import { supabase } from '@/lib/supabaseClient';

const TARGET_EMAIL = 'park485201@naver.com';

/** Temporary development-only controls; remove after device notification QA. */
export function NotificationDebugToolbar() {
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [message, setMessage] = useState('누른 뒤 앱을 내려 백그라운드 수신도 확인하세요.');

  if (!__DEV__ || Platform.OS === 'web') return null;

  async function run(cancel: boolean) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (cancel) {
        await cancelDebugNotification();
        setMessage('대기 중인 테스트 알림을 취소했습니다.');
      } else {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!user || user.email?.toLowerCase() !== TARGET_EMAIL) {
          setMessage(`${TARGET_EMAIL} 계정으로 로그인해 주세요.`);
          return;
        }
        const [bean] = await BeanAPI.getUserBeans(user.id);
        if (!bean) {
          setMessage('이 계정에 등록된 원두가 없습니다. 원두를 먼저 등록해 주세요.');
          return;
        }
        const scheduled = await scheduleDebugNotification(bean);
        setMessage(scheduled
          ? `${bean.name} · 5초 뒤 알림이 옵니다. 지금 앱을 내려보세요.`
          : '알림 권한이 없습니다. iPhone 설정에서 허용해 주세요.');
      }
    } catch (error) {
      setMessage(`실패: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.title}>DEV · 디개싱 알림 테스트</Text>
        <Pressable accessibilityRole="button" hitSlop={10} onPress={() => setCollapsed(!collapsed)}>
          <Text style={styles.link}>{collapsed ? '펼치기' : '접기'}</Text>
        </Pressable>
      </View>
      {!collapsed && <>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(false)} style={[styles.button, busy && styles.disabled]}>
            <Text style={styles.buttonText}>{busy ? '처리 중…' : '5초 뒤 알림'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(true)} style={[styles.button, styles.secondary, busy && styles.disabled]}>
            <Text style={styles.buttonText}>테스트 알림 취소</Text>
          </Pressable>
        </View>
        <Text accessibilityLiveRegion="polite" style={styles.caption}>{message}</Text>
        <Text style={styles.caption}>{TARGET_EMAIL}의 최근 원두 · 알림을 탭하면 해당 원두로 이동합니다.</Text>
      </>}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#241C17', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { color: '#FFE0AF', fontSize: 12, fontWeight: '700' },
  link: { color: '#FFE0AF', fontSize: 12, paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  button: { flex: 1, backgroundColor: '#8B4513', borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  secondary: { backgroundColor: '#4B4039' },
  disabled: { opacity: 0.5 },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  caption: { color: '#E0D4CA', fontSize: 11, marginBottom: 4 },
});
