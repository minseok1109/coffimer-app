import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useRef } from "react";
import { Alert, Platform, Vibration } from "react-native";

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const useNotification = () => {
  const isInitializedRef = useRef(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  // 오디오 및 알림 초기화
  useEffect(() => {
    loadSound();

    return () => {
      // 컴포넌트 언마운트 시 사운드 해제
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadSound = async () => {
    try {
      // 짧은 비프음 생성을 위한 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 간단한 비프음 생성 (주파수 기반)
      const { sound } = await Audio.Sound.createAsync(
        {
          uri: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmMeAz2O0fPGdCkGJ3fA7+OZQQQ=",
        },
        { shouldPlay: false, volume: 0.7 }
      );

      soundRef.current = sound;
    } catch (error) {
      console.log("사운드 로드 실패:", error);
    }
  };

  // 사용자 상호작용으로 햅틱 피드백 활성화
  const initializeAudio = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        // 알림 권한 요청
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.log("알림 권한이 거부되었습니다.");
        }

        // 오디오 활성화를 위한 무음 재생
        if (soundRef.current) {
          await soundRef.current.setVolumeAsync(0);
          await soundRef.current.playAsync();
          await soundRef.current.stopAsync();
          await soundRef.current.setVolumeAsync(0.7);
        }

        isInitializedRef.current = true;
      } catch (error) {
        console.log("알림 초기화 실패:", error);
      }
    }
  }, []);

  const sendNotification = useCallback(async (title: string, body: string) => {
    try {
      // 사운드 재생
      if (soundRef.current) {
        try {
          await soundRef.current.replayAsync();
        } catch (soundError) {
          console.log("사운드 재생 실패:", soundError);
        }
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
  }, []);

  return { sendNotification, initializeAudio };
};
