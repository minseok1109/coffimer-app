# Coffimer 앱 정책 문서

이 폴더에는 Coffimer 앱의 법적 정책 문서들이 포함되어 있습니다.

## 포함된 문서

### 📋 개인정보 보호정책 (privacy-policy.md)
- 애플 앱 스토어 심사 필수 요구사항
- 수집하는 데이터, 사용 목적, 보안 조치 등을 상세히 설명
- GDPR, CCPA, 개인정보보호법 준수

### 📋 서비스 이용약관 (terms-of-service.md)
- 앱 사용에 관한 규칙과 조건
- 사용자 권리와 의무, 면책조항 등을 포함
- 분쟁 해결 절차 명시

## 호스팅 방법

이 정책 문서들을 웹에 호스팅하려면:

### 1. GitHub Pages 사용
```bash
# GitHub 저장소에 docs 폴더 푸시
git add docs/
git commit -m "Add privacy policy and terms of service"
git push origin main

# GitHub 저장소 Settings > Pages에서 활성화
# URL: https://username.github.io/repository-name/privacy-policy
```

### 2. Netlify 사용
```bash
# Netlify에 docs 폴더 배포
netlify deploy --dir=docs --prod
```

### 3. 개인 웹사이트
- `privacy-policy.md`를 HTML로 변환하여 `https://coffimer.app/privacy`에 호스팅
- `terms-of-service.md`를 HTML로 변환하여 `https://coffimer.app/terms`에 호스팅

## 앱 코드 업데이트

호스팅 후 `app/info.tsx`에서 URL을 실제 주소로 변경:

```typescript
// 현재 (예시 URL)
WebBrowser.openBrowserAsync("https://coffimer.app/privacy");

// 실제 호스팅 URL로 변경
WebBrowser.openBrowserAsync("https://yourdomain.com/privacy-policy");
```

## 주의사항

- 정책을 변경할 때는 앱 내에서도 사용자에게 알림 필요
- 애플 앱 스토어 제출 시 정책 URL이 실제로 접근 가능해야 함
- 정책은 앱의 실제 기능과 일치해야 함

## 연락처

정책 관련 문의: minseok32@gmail.com