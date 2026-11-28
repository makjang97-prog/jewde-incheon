# 쥬드주얼리 인천점 — 원페이지 홈페이지

청담 예물 명가 쥬드주얼리의 인천점 공식 안내 페이지입니다.
https://jewdeincheon.com

## 구성

| 파일 | 설명 |
|---|---|
| `index.html` | 페이지 전체(문구·섹션·구조화 데이터 JSON-LD) |
| `styles.css` | 색·서체·여백·반응형 (`:root` 변수) |
| `script.js` | 헤더·모바일 메뉴·스크롤 효과·FAQ·메일 유입 추적 |
| `assets/map.jpg` | 매장 주변 약도 — 컬러 OpenStreetMap 타일 (2026-11 생성) |
| `assets/ring-sketch.jpg` | About 섹션 반지 디자인 연필 스케치 (본사 `jewde.com` 촬영본, 모노톤 보정) |
| `assets/atelier-hamchaehun.jpg` | 함채헌 섹션 자체공방 장인 사진 (본사 `jewde.com` 공방4) |
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

- **네이버 예약**: `index.html`의 `https://booking.naver.com/booking/6/bizes/1389525`
- **블로그·인스타·플레이스**: `index.html`의 각 채널 링크
- **주소·전화·운영시간**: `index.html`의 `#visit` 섹션과 `<footer>`, 그리고 JSON-LD
  (`JewelryStore`) 세 곳을 함께 수정합니다.
- **공유 썸네일**: `assets/og.html`을 고친 뒤 스크립트로 `og-image.png`를 다시 캡처합니다.

## 배포

- GitHub: `makjang97-prog/jewde-incheon` (public)
- Vercel: 프로젝트 `jewde-incheon` (팀 `maisonyoung`, Hobby)
- Production: https://jewdeincheon.com (보조 도메인 www.jewdeincheon.com → 308, jewde-incheon.vercel.app)

## 주의

- 카카오톡 상담 카드와 채널 안내 모달은 2026-11-28 대표 결정으로 페이지에서 삭제했습니다. 다시 넣을 때는 채널 섹션(`.channel-grid`)에 네이버 예약·블로그·인스타 카드와 같은 형식("channel-card")으로 추가합니다.
- 본사(`jewde.com`)의 대표자·사업자 정보는 이 페이지에 넣지 않습니다. 인천점 정보만 표기합니다.
- 함채헌 공방 경력은 **30년 이상**으로만 표기합니다.
- 사진 2장(`ring-sketch.jpg`, `atelier-hamchaehun.jpg`)은 본사 `jewde.com`의 쥬드 촬영본을 내려받아 사이트 안에 함께 올린 파일입니다(외부 핫링크 아님). 사진을 바꿀 때도 같은 방식으로 `assets/`에 넣어 주세요.
- `SINCE 1989`는 본사(1989년 청담)의 연혜이고, 인천점은 **2023년** 개점입니다. 헤더·푸터 표기는 `INCHEON · EST. 2023`을 유지합니다.
