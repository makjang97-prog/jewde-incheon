/* /go-booking  →  기록 후 네이버 예약으로 이동
   ---------------------------------------------------------
   예) https://jewdeincheon.com/go-booking?src=mail
   메일·문자에서 이 주소를 누르면 marketing_link_clicks 에 1건 기록하고
   네이버 예약 페이지로 넘깁니다. 기록이 실패해도 이동은 그대로 합니다.
   ========================================================= */
'use strict';

const track = require('../lib/track');

module.exports = async (req, res) => {
  const params = req.query || {};
  const src = track.cleanSource(params.src || params.from || '');
  const v = track.visitor(req);

  let result = { ok: false };
  try {
    result = await track.record(req, { source: src, target: 'naver_booking', visitorId: v.id });
  } catch (e) {
    result = { ok: false, error: String(e && e.message ? e.message : e) };
  }

  if (result.ok === false) {
    console.error('[go-booking] record failed', JSON.stringify(result));
  }

  res.statusCode = 302;
  res.setHeader('Location', track.BOOKING_URL);
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Set-Cookie', track.visitorCookie(v.id));
  res.end();
};
