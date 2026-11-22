# 쥬드주얼리 인천점 — 원페이지 홈페이지

청담 예물 명가 쥬드주얼리의 인천점 공식 안내 페이지입니다.
https://jewde-incheon.vercel.app

## 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 페이지 전체(문구·섹션·구조화 데이터 JSON-LD) |
| `styles.css` | 색·서체·여백·반응형 (`:root` 변수) |
| `script.js` | 헤더·모바일 메뉴·스크롤 효과·FAQ·카카오 안내 모달 |
| `assets/map.jpg` | 매장 주변 약도 (OpenStreetMap 타일, 2026-11 생성) |
| `assets/og-image.png` | 카카오톡·SNS 공유 썸네일 (1200×630) |
| `robots.txt`, `sitemap.xml` | 검색엔진 수집 설정 |

## 수정 방법

```bash
# 파일 수정 후
git add -A
git commit -m "문구 수정"
git push
```

`main` 브랜치에 푸시하면 Vercel이 자동으로 Production에 다시 배포합니다.

## 자주 고치는 곳

- **카카오톡 채널 링크**: `script.js` 맨 위 `KAKAO_CHANNEL_URL` 상수에 채널 주소를 넣으면
  카카오톡 상담 버튼이 안내 모달 대신 채널로 바로 연결됩니다.
- **네이버 예약**: `index.html`의 `https://booking.naver.com/booking/6/bizes/1389525`
- **블로그·인스타·플레이스**: `index.html`의 각 채널 링크
- **주소·전화·운영시간**: `index.html`의 `#visit` 섹션과 `<footer>`, 그리고 JSON-LD
  (`JewelryStore`) 세 곳을 함께 수정합니다.
- **공유 썸네일**: `assets/og.html`을 고친 뒤 스크립트로 `og-image.png`를 다시 캡처합니다.

## 배포

- GitHub: `makjang97-prog/jewde-incheon` (public)
- Vercel: 프로젝트 `jewde-incheon` (팀 `maisonyoung`, Hobby)
- Production: https://jewde-incheon.vercel.app

## 주의

- 본사(`jewde.com`)의 대표자·사업자 정보는 이 페이지에 넣지 않습니다. 인천점 정보만 표기합니다.
- 함채헌 공방 경력은 **30년 이상**으로만 표기합니다.
