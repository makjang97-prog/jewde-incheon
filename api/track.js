/* /api/track — 원페이지 안에서 일어난 클릭 기록 (landing / naver_booking)
   ---------------------------------------------------------
   페이지가 보내는 비콘 전용입니다. 화면에는 아무것도 그리지 않고 204 로 응답합니다.
   예) /api/track?src=mail&target=landing
   ========================================================= */
'use strict';

const track = require('../lib/track');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    res.end();
    return;
  }

  const params = req.query || {};
  const src = track.cleanSource(params.src || params.from || '');
  const target = track.cleanTarget(params.target || 'landing');
  const v = track.visitor(req);

  try {
    const result = await track.record(req, { source: src, target: target, visitorId: v.id });
    if (result.ok === false) {
      console.error('[track] record failed', JSON.stringify(result));
    }
  } catch (e) {
    console.error('[track] error', String(e && e.message ? e.message : e));
  }

  res.statusCode = 204;
  res.setHeader('Set-Cookie', track.visitorCookie(v.id));
  res.end();
};
