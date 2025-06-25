import { AudioModule, useAudioPlayer } from "expo-audio";
import { useCallback, useEffect, useRef } from "react";


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

  // 오디오 초기화
  const initializeAudio = useCallback(async () => {
    if (!isInitializedRef.current) {
      try {
        // 오디오 모드 설정
        await configureAudioMode();

        // 오디오 활성화를 위한 준비
        alarmPlayer.volume = 0.7;

        isInitializedRef.current = true;
      } catch (error) {
        console.log("오디오 초기화 실패:", error);
      }
    }
  }, [alarmPlayer]);

  // 오디오 초기화
  useEffect(() => {
    initializeAudio();
  }, [initializeAudio]);

  const sendNotification = useCallback(
    async (title: string, body: string) => {
      try {
        // 사운드 재생
        // 오디오 초기화 확인
        if (!isInitializedRef.current) {
          await initializeAudio();
        }
        
        // 매번 확실하게 재생하기 위해 정지 후 처음부터 재생
        if (alarmPlayer.playing) {
          alarmPlayer.pause();
        }
        alarmPlayer.seekTo(0);
        alarmPlayer.volume = 1.0; // 최대 볼륨으로 설정
        alarmPlayer.play();
        
        console.log(`🔊 알람 사운드 재생됨: ${title} - ${body}`);
      } catch (error) {
        console.log("사운드 재생 실패:", error);
      }
    },
    [alarmPlayer, initializeAudio]
  );

  return { sendNotification, initializeAudio };
};
