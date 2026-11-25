/* =========================================================
   JEWDE JEWELRY INCHEON — 메일·링크 클릭 추적 공용 모듈
   ---------------------------------------------------------
   - Supabase(쥬드 CRM과 같은 프로젝트) marketing_link_clicks 테이블에 기록
   - 서버(서비스 롤 키)에서만 접근하며 브라우저에는 키를 내보내지 않습니다.
   ========================================================= */
'use strict';

const crypto = require('crypto');

const BOOKING_URL = 'https://booking.naver.com/booking/6/bizes/1389525';
const TABLE = 'marketing_link_clicks';
const ALLOWED_TARGETS = ['naver_booking', 'landing'];
const VISITOR_COOKIE = 'jewde_vid';
const VISITOR_MAX_AGE = 60 * 60 * 24 * 365; // 1년

function supabase() {
  return {
    url: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
}

/** 유입 표기 정리: 소문자·영숫자·-·_ 만, 최대 32자 */
function cleanSource(value) {
  const s = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32);
  return s || 'direct';
}

function cleanTarget(value) {
  const t = String(value || '').trim().toLowerCase();
  return ALLOWED_TARGETS.indexOf(t) === -1 ? 'landing' : t;
}

function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  const parts = raw.split(';');
  for (let i = 0; i < parts.length; i++) {
    const idx = parts[i].indexOf('=');
    if (idx === -1) continue;
    if (parts[i].slice(0, idx).trim() === name) {
      return decodeURIComponent(parts[i].slice(idx + 1).trim());
    }
  }
  return '';
}

/** 같은 사람이 다시 들어와도 같은 값이 되도록 1년짜리 쿠키로 방문자 번호를 둡니다. */
function visitor(req) {
  const existing = readCookie(req, VISITOR_COOKIE);
  if (existing && /^[a-f0-9]{16,32}$/.test(existing)) {
    return { id: existing, isNew: false };
  }
  const id = crypto.randomBytes(12).toString('hex');
  return { id: id, isNew: true };
}

function visitorCookie(id) {
  return (
    VISITOR_COOKIE + '=' + encodeURIComponent(id) +
    '; Path=/; Max-Age=' + VISITOR_MAX_AGE + '; SameSite=Lax; Secure'
  );
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length) return fwd.split(',')[0].trim();
  return (req.socket && req.socket.remoteAddress) || '';
}

async function record(req, opts) {
  const db = supabase();
  if (!db.url || !db.key) {
    return { ok: false, error: 'supabase_not_configured' };
  }

  const row = {
    source: cleanSource(opts.source),
    target: cleanTarget(opts.target),
    visitor_id: opts.visitorId || null,
    referer: String(req.headers.referer || '').slice(0, 500) || null,
    user_agent: String(req.headers['user-agent'] || '').slice(0, 500) || null,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2000);
  try {
    const res = await fetch(db.url + '/rest/v1/' + TABLE, {
      method: 'POST',
      headers: {
        apikey: db.key,
        Authorization: 'Bearer ' + db.key,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify([row]),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, error: 'insert_failed', status: res.status, detail: text.slice(0, 300) };
    }
    return { ok: true, row: row };
  } catch (e) {
    return { ok: false, error: 'insert_error', detail: String(e && e.message ? e.message : e) };
  } finally {
    clearTimeout(timer);
  }
}

async function query(path) {
  const db = supabase();
  if (!db.url || !db.key) throw new Error('supabase_not_configured');
  const res = await fetch(db.url + '/rest/v1/' + TABLE + path, {
    headers: {
      apikey: db.key,
      Authorization: 'Bearer ' + db.key,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error('query_failed ' + res.status + ' ' + text.slice(0, 200));
  }
  return res.json();
}

module.exports = {
  BOOKING_URL,
  TABLE,
  ALLOWED_TARGETS,
  cleanSource,
  cleanTarget,
  visitor,
  visitorCookie,
  clientIp,
  record,
  query,
};
