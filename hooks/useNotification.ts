import { AudioModule, useAudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Alert, Platform, Vibration } from "react-native";

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotification = () => {
  const isInitializedRef = useRef(false);

  // expo-audio의 useAudioPlayer 훅 사용
  const alarmPlayer = useAudioPlayer(require("../public/alarm.mp3"));

  // 오디오 모드 설정
  const configureAudioMode = async () => {
    try {
      // expo-audio는 기본 설정을 사용하고, 필요시 개별 설정만 적용
      await AudioModule.setAudioModeAsync({
        playsInSilentMode: true, // 무음 모드에서도 재생
      });
    } catch (error) {
      console.log("오디오 모드 설정 실패:", error);
      // 오디오 모드 설정이 실패해도 계속 진행
    }
  };

  // 사용자 상호작용으로 햅틱 피드백 활성화
  const initializeAudio = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        // 오디오 모드 설정
        await configureAudioMode();

        // 알림 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.log("알림 권한이 거부되었습니다.");
        }

        // 오디오 활성화를 위한 준비
        alarmPlayer.volume = 0.7;

        isInitializedRef.current = true;
      } catch (error) {
        console.log("알림 초기화 실패:", error);
      }
    }
  }, [alarmPlayer]);

  // 오디오 및 알림 초기화
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  const sendNotification = useCallback(
    async (title: string, body: string) => {
      try {
        // 사운드 재생
        try {
          // 플레이어가 이미 재생 중이면 처음부터 다시 재생
          if (alarmPlayer.playing) {
            alarmPlayer.seekTo(0);
          } else {
            alarmPlayer.play();
          }
        } catch (soundError) {
          console.log("사운드 재생 실패:", soundError);
        }

        // 햅틱 피드백 (iOS)
        if (Platform.OS === "ios") {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
        }

        // 진동 알림 (강한 진동 패턴)
        if (Platform.OS === "ios") {
          Vibration.vibrate([0, 250, 100, 250, 100, 250]);
        } else {
          Vibration.vibrate([0, 300, 200, 300]);
        }

        // 로컬 알림 전송 (사운드 포함)
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: "default", // 시스템 기본 알림 사운드 사용
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null, // 즉시 실행
        });

        // 개발용 로그
        console.log(`🔔 알림: ${title} - ${body}`);
      } catch (error) {
        console.log("알림 전송 실패:", error);

        // 백업: 진동만 실행
        try {
          Vibration.vibrate(1000);
          if (Platform.OS === "ios") {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        } catch (vibrationError) {
          console.log("진동 실행 실패:", vibrationError);
        }

        // 최종 백업: Alert 표시
        Alert.alert(title, body, [
          {
            text: "확인",
            style: "default",
          },
        ]);
      }
    },
    [alarmPlayer]
  );

  return { sendNotification, initializeAudio };
};
