# 안드로이드 실제 기기 테스트 가이드

## 목차
1. [사전 준비사항](#사전-준비사항)
2. [개발 빌드 생성](#개발-빌드-생성)
3. [실제 기기 설정](#실제-기기-설정)
4. [APK 빌드 및 설치](#apk-빌드-및-설치)
5. [문제 해결](#문제-해결)

## 사전 준비사항

### 1. 개발 환경 확인
- Node.js 18 이상
- pnpm 패키지 매니저
- EAS CLI 설치 (이미 설치됨)

### 2. 프로젝트 의존성 설치
```bash
pnpm install
```

## 개발 빌드 생성

### 방법 1: Expo Go 앱 사용 (권장)

가장 빠른 테스트 방법입니다.

1. **안드로이드 기기에 Expo Go 앱 설치**
   - Google Play Store에서 "Expo Go" 검색 후 설치

2. **개발 서버 시작**
   ```bash
   pnpm start
   # 또는
   expo start
   ```

3. **QR 코드로 연결**
   - 터미널에 표시된 QR 코드를 Expo Go 앱으로 스캔
   - 앱이 자동으로 로드됩니다

### 방법 2: 개발 빌드 (Development Build)

커스텀 네이티브 코드가 필요한 경우 사용합니다.

1. **EAS 빌드 설정**
   ```bash
   eas build:configure
   ```

2. **개발 빌드 생성**
   ```bash
   # 개발 빌드 생성 (APK)
   eas build --platform android --profile development --local
   
   # 또는 클라우드 빌드 (무료 계정은 월 30회 제한)
   eas build --platform android --profile development
   ```

3. **빌드된 APK 다운로드**
   - 빌드 완료 후 제공되는 링크에서 APK 다운로드

## 실제 기기 설정

### 안드로이드 기기 개발자 모드 활성화

1. **개발자 옵션 활성화**
   - 설정 → 디바이스 정보 → 빌드 번호를 7번 탭
   - 개발자 모드가 활성화됩니다

2. **USB 디버깅 활성화**
   - 설정 → 개발자 옵션 → USB 디버깅 켜기
   - USB로 컴퓨터와 연결 시 "USB 디버깅 허용" 승인

3. **APK 설치 허용**
   - 설정 → 보안 → 출처를 알 수 없는 앱 설치 허용
   - 또는 Chrome 브라우저에 APK 설치 권한 부여

## APK 빌드 및 설치

### 방법 1: 프로덕션 APK 빌드

1. **프로덕션 빌드 생성**
   ```bash
   # 로컬 빌드 (Java JDK 필요)
   eas build --platform android --profile preview --local
   
   # 또는 클라우드 빌드
   eas build --platform android --profile preview
   ```

2. **APK 설치**
   - 다운로드한 APK 파일을 기기로 전송
   - 파일 관리자에서 APK 파일 실행
   - 설치 진행

### 방법 2: USB 연결 직접 설치

1. **ADB 설치 확인**
   ```bash
   adb devices
   ```

2. **기기 연결 확인**
   - USB로 연결된 기기가 목록에 표시되어야 함

3. **앱 실행**
   ```bash
   pnpm run android
   # 또는
   expo run:android
   ```

## 테스트 체크리스트

### 기능 테스트
- [ ] 레시피 목록 표시
- [ ] 레시피 상세 정보 확인
- [ ] 타이머 시작/일시정지/재시작
- [ ] 알림 소리 재생
- [ ] 진동 피드백
- [ ] 다크모드 전환
- [ ] 로그인/회원가입 (Supabase 연동)

### 성능 테스트
- [ ] 앱 로딩 시간 (3초 이내)
- [ ] 화면 전환 부드러움
- [ ] 타이머 정확도
- [ ] 메모리 사용량

## 문제 해결

### Expo Go 연결 안됨
- 기기와 컴퓨터가 같은 Wi-Fi에 연결되어 있는지 확인
- 방화벽 설정 확인 (포트 19000, 19001, 19002 허용)
- `expo start --tunnel` 명령어로 터널 모드 사용

### APK 설치 실패
- 기존 앱 제거 후 재설치
- 최소 안드로이드 버전 확인 (Android 7.0 이상 필요)
- 저장 공간 확인

### 빌드 실패
- Node modules 재설치: `pnpm install --force`
- 캐시 클리어: `expo start --clear`
- EAS 빌드 캐시 클리어: `eas build --clear-cache`

### 타이머/알림 작동 안함
- 앱 권한 설정에서 알림 권한 허용
- 배터리 최적화 예외 설정
- 백그라운드 실행 허용

## 유용한 명령어

```bash
# 로그 확인
adb logcat | grep "coffimer"

# 앱 제거
adb uninstall com.bangbangminseok.coffimerapp

# 메트로 번들러 재시작
expo start --clear

# 빌드 상태 확인
eas build:list --platform android

# 디바이스 정보 확인
eas device:list
```

## 추가 리소스

- [Expo 공식 문서](https://docs.expo.dev/)
- [EAS Build 가이드](https://docs.expo.dev/build/introduction/)
- [안드로이드 개발자 문서](https://developer.android.com/studio/debug/dev-options)

---

**작성일**: 2025-08-12
**프로젝트**: Coffimer App v1.0.11