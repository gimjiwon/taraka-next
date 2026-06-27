# TAKARA Webapp Starter

정적 HTML 프로토타입을 실제 서비스형 웹앱으로 전환하기 위한 Next.js + Supabase 스타터 프로젝트입니다.

## 포함된 것

- Next.js App Router 기반 페이지 구조
- TAKARA 고객 화면: 메인, 쿠지 목록, 상세, 대기열, 번호 선택, 결제, 결과 공개
- TAKARA 관리자 화면: 대시보드, 쿠지 등록/관리, 주문·배송, 회원, 로그
- Supabase DB 스키마 초안
- 서버 기반 번호 잠금 RPC 초안
- 결과 공개 컴포넌트: 하나씩 열기 / 한번에 열기
- 탭 전환에도 멈추지 않는 deadline 기반 타이머 컴포넌트

## 실행 방법

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

## Supabase 연결 순서

1. Supabase 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. `.env.local`에 Supabase URL / anon key / service role key 입력
4. Auth 설정
5. 관리자 계정 생성 후 `profiles.role = 'admin'`으로 변경
6. API route의 TODO 부분을 Supabase RPC 호출로 교체

## 핵심 전환 원칙

기존 HTML 프로토타입은 localStorage를 사용했지만, 정식 웹앱에서는 아래 데이터가 모두 DB 기준이어야 합니다.

- 회원/관리자 계정
- 쿠지 등록 정보
- 상품/번호 배치
- 대기열 상태
- 번호 잠금 상태
- 결제 상태
- 결과 공개 상태
- 보관함/배송 요청
- 운영 로그

## 운영 전 필수 보강

- 결제 PG 실제 검증
- 관리자 권한 API 단위 검증
- RLS 정책 강화
- 쿠지 대기열 claim RPC 구현
- 주문 생성/결제 완료 webhook 구현
- 이미지 업로드 스토리지 연결
- 개인정보 처리방침/이용약관/환불불가 고지 정리
