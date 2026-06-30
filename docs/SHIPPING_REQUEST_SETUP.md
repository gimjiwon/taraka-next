# TAKARA 배송 신청 기능

이번 버전에서 추가된 기능입니다.

## 고객 기능

- `/shipping`에서 보관중인 상품 선택
- 여러 상품 합배송 신청
- 수령인, 연락처, 우편번호, 기본주소, 상세주소, 배송 요청사항 입력
- 배송 신청 내역 확인
- 배송 상태 및 운송장 번호 확인

## 관리자 기능

- `/admin/shipping` 배송 신청 목록 확인
- 배송 상태 변경
  - 신청완료
  - 배송 준비중
  - 발송완료
  - 배송완료
- 운송장 번호 입력
- 배송 상태 변경 시 보관함 상품 상태도 함께 변경

## DB

기존 schema.sql에 이미 포함된 아래 테이블을 사용합니다.

- `shipping_requests`
- `shipping_request_items`
- `storage_items.shipping_status`

초기 schema.sql을 이미 실행했다면 추가 SQL 없이 사용할 수 있습니다.
