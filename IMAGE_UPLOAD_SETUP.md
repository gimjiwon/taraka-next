# TAKARA 로그인 구조 정리 패치

## 목적

로그인 판정 기준을 하나로 통일합니다.

기존 문제는 여러 로그인 방식이 섞여 있었던 것입니다.

- Supabase SSR 쿠키
- 브라우저 Supabase 세션
- TAKARA 자체 쿠키
- 로그아웃 GET 라우트

이 중 가장 치명적인 문제는 `/logout`이 GET 라우트였다는 점입니다. 로그인 상태일 때 헤더에 `/logout` 링크가 있고, Next.js가 링크를 미리 읽는 과정에서 GET `/logout`이 실행되면 사용자가 직접 로그아웃을 누르지 않아도 쿠키가 삭제될 수 있습니다.

## 수정 방향

- Supabase는 비밀번호 검증에만 사용합니다.
- 사이트 로그인 판정은 `takara_session` 쿠키만 사용합니다.
- 백업 쿠키 `takara_session_backup`도 같은 서명 검증을 통과해야만 인정합니다.
- 로그아웃은 GET이 아니라 POST `/api/auth/logout`으로만 실행합니다.
- 헤더의 로그아웃 링크를 버튼으로 교체했습니다.
- GET `/logout`은 쿠키를 삭제하지 않고 홈으로 이동만 합니다.
- 관리자 API도 Supabase SSR 세션이 아니라 TAKARA 세션 기준으로 권한을 확인합니다.

## 배포 후 확인

1. `/logout` 접속
2. `/login` 접속 후 다시 로그인
3. `/api/debug/session` 확인
4. `loggedIn: true` 확인
5. `/kuji` → 상세 → 입장하기 → 번호 선택 → 결제 이동 확인
6. 이동 후 다시 `/api/debug/session`에서 `loggedIn: true` 유지 확인

