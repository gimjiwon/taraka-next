# TAKARA Route Map

## Customer

- `/` 메인
- `/kuji` 쿠지 목록
- `/kuji/[id]` 쿠지 상세
- `/kuji/[id]/queue` 대기열
- `/kuji/[id]/select` 번호 선택
- `/kuji/[id]/payment` 결제
- `/kuji/[id]/result` 결과 공개
- `/login` 로그인
- `/signup` 회원가입
- `/mypage` 마이페이지
- `/storage` 보관함
- `/shipping` 배송 요청
- `/shop` 일반 쇼핑몰
- `/notice` 공지사항

## Admin

- `/admin` 관리자 대시보드
- `/admin/kuji` 쿠지 등록/관리
- `/admin/orders` 주문·배송
- `/admin/members` 회원 관리
- `/admin/logs` 운영 로그

## API

- `POST /api/queue/join` 대기열 입장
- `POST /api/queue/claim` 선택 권한 획득
- `POST /api/tickets/reserve` 번호 잠금
- `POST /api/tickets/release` 번호 잠금 해제
- `POST /api/payment/complete` 결제 완료 검증
- `POST /api/result/reveal` 결과 공개 상태 저장
