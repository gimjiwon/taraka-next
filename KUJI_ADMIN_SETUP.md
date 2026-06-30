# TAKARA Auth Setup

이 패치 이후 로그인/회원가입은 Supabase Auth와 연결됩니다.

## 반영 파일
- `app/login/page.tsx`
- `app/login/LoginForm.tsx`
- `app/signup/page.tsx`
- `app/signup/SignupForm.tsx`
- `app/logout/route.ts`
- `app/api/auth/signup/route.ts`
- `app/api/auth/resolve-login/route.ts`
- `app/api/check-duplicate/route.ts`
- `components/SiteHeader.tsx`
- `app/admin/**/page.tsx`
- `lib/supabase-server.ts`
- `app/globals.css`

## 관리자 계정
첫 번째로 회원가입한 계정은 자동으로 `admin` 권한을 받습니다.
이미 일반 회원으로 가입했다면 Supabase SQL Editor에서 아래 SQL을 실행하세요.

```sql
update public.profiles
set role = 'admin'
where email = '본인 이메일 주소';
```

## 배포 후 해야 할 일
1. GitHub에 변경 파일 업로드
2. Vercel 재배포
3. `/signup`에서 첫 계정 생성
4. `/login`에서 로그인
5. `/admin` 접속 확인
