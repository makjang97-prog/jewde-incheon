/* /clicks — 메일·링크 클릭 집계 화면 (관리용, 주소에 key 필요)
   ---------------------------------------------------------
   예) https://jewdeincheon.com/clicks?key=발급받은키
       https://jewdeincheon.com/clicks?key=발급받은키&format=json
   집계만 보여 주고, 방문자 개인정보(번호 원문·IP)는 노출하지 않습니다.
   ========================================================= */
'use strict';

const crypto = require('crypto');
const track = require('../lib/track');

const RANGE_DAYS = 30;

function sameKey(a, b) {
  if (!a || !b) return false;
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function kstParts(date) {
  const t = new Date(date.getTime() + 9 * 3600 * 1000);
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth() + 1,
    d: t.getUTCDate(),
    hh: t.getUTCHours(),
    mm: t.getUTCMinutes(),
  };
}

function kstDayStart(daysAgo) {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  const startUtcMs =
    Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate()) -
    9 * 3600 * 1000 -
    daysAgo * 24 * 3600 * 1000;
  return new Date(startUtcMs);
}

function stamp(value) {
  const p = kstParts(new Date(value));
  const pad = (n) => String(n).padStart(2, '0');
  return p.m + '/' + pad(p.d) + ' ' + pad(p.hh) + ':' + pad(p.mm);
}

function label(target) {
  if (target === 'naver_booking') return '네이버 예약 이동';
  if (target === 'landing') return '원페이지 방문';
  return target;
}

function summarize(rows) {
  const today = kstDayStart(0).getTime();
  const week = kstDayStart(6).getTime();
  const month = kstDayStart(29).getTime();

  const empty = () => ({ clicks: 0, visitors: new Set(), bookings: 0, bookingsVisitors: new Set() });
  const bucket = () => ({ total: empty(), today: empty(), week: empty(), month: empty() });
  const overall = bucket();
  const bySource = new Map();

  rows.forEach((r) => {
    const t = new Date(r.created_at).getTime();
    const key = r.source || 'direct';
    if (!bySource.has(key)) bySource.set(key, bucket());
    const sourceBucket = bySource.get(key);

    [overall, sourceBucket].forEach((b) => {
      b.total.clicks += 1;
      if (r.visitor_id) b.total.visitors.add(r.visitor_id);
      if (r.target === 'naver_booking') {
        b.total.bookings += 1;
        if (r.visitor_id) b.total.bookingsVisitors.add(r.visitor_id);
      }
      if (t >= today) {
        b.today.clicks += 1;
        if (r.visitor_id) b.today.visitors.add(r.visitor_id);
        if (r.target === 'naver_booking') {
          b.today.bookings += 1;
          if (r.visitor_id) b.today.bookingsVisitors.add(r.visitor_id);
        }
      }
      if (t >= week) {
        b.week.clicks += 1;
        if (r.visitor_id) b.week.visitors.add(r.visitor_id);
        if (r.target === 'naver_booking') {
          b.week.bookings += 1;
          if (r.visitor_id) b.week.bookingsVisitors.add(r.visitor_id);
        }
      }
      if (t >= month) {
        b.month.clicks += 1;
        if (r.visitor_id) b.month.visitors.add(r.visitor_id);
        if (r.target === 'naver_booking') {
          b.month.bookings += 1;
          if (r.visitor_id) b.month.bookingsVisitors.add(r.visitor_id);
        }
      }
    });
  });

  const plain = (p) => ({
    clicks: p.clicks,
    visitors: p.visitors.size,
    bookings: p.bookings,
    booking_visitors: p.bookingsVisitors.size,
  });
  const plainBucket = (b) => ({
    total: plain(b.total),
    today: plain(b.today),
    week: plain(b.week),
    month: plain(b.month),
  });

  const sources = Array.from(bySource.entries())
    .map(([source, b]) => ({ source: source, ...plainBucket(b) }))
    .sort((a, b) => b.total.clicks - a.total.clicks);

  return {
    generated_at: new Date().toISOString(),
    overall: plainBucket(overall),
    sources: sources,
    recent: rows.slice(0, 20).map((r) => ({
      created_at: r.created_at,
      source: r.source,
      target: r.target,
    })),
  };
}

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function html(report) {
  const o = report.overall;
  const statCard = (title, value, sub) =>
    '<div class="card"><div class="card-t">' + esc(title) + '</div>' +
    '<div class="card-v">' + esc(value) + '</div>' +
    (sub ? '<div class="card-s">' + esc(sub) + '</div>' : '') + '</div>';

  const sourceRows = report.sources
    .map(
      (s) =>
        '<tr><td class="src">' + esc(s.source) + '</td>' +
        '<td>' + s.total.clicks + '</td>' +
        '<td>' + s.total.visitors + '</td>' +
        '<td>' + s.total.bookings + '</td>' +
        '<td>' + s.week.clicks + '</td>' +
        '<td>' + s.month.clicks + '</td></tr>'
    )
    .join('');

  const recentRows = report.recent
    .map(
      (r) =>
        '<tr><td>' + esc(stamp(r.created_at)) + '</td>' +
        '<td class="src">' + esc(r.source) + '</td>' +
        '<td>' + esc(label(r.target)) + '</td></tr>'
    )
    .join('');

  return '<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<meta name="robots" content="noindex, nofollow">' +
    '<title>쥬드 인천 · 클릭 추적</title>' +
    '<style>' +
    ':root{color-scheme:light}' +
    'body{margin:0;background:#faf9f7;color:#1d1b19;font-family:"Pretendard",-apple-system,BlinkMacSystemFont,"Apple SD Gothic Neo","Noto Sans KR",sans-serif}' +
    '.wrap{max-width:920px;margin:0 auto;padding:28px 20px 60px}' +
    'h1{font-family:Georgia,"Noto Serif KR",serif;font-weight:400;font-size:24px;letter-spacing:.02em;margin:0 0 4px}' +
    '.sub{font-size:14px;color:#6f6a63;margin-bottom:22px}' +
    '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:26px}' +
    '.card{background:#fff;border:1px solid #e8e3db;border-radius:12px;padding:16px 18px}' +
    '.card-t{font-size:14px;color:#6f6a63;margin-bottom:6px}' +
    '.card-v{font-size:32px;font-weight:600;letter-spacing:-.01em}' +
    '.card-s{font-size:13px;color:#8a847c;margin-top:4px}' +
    'h2{font-size:17px;font-weight:600;margin:30px 0 10px}' +
    'table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e8e3db;border-radius:12px;overflow:hidden;font-size:15px}' +
    'th,td{padding:11px 12px;text-align:right;border-bottom:1px solid #f0ece5}' +
    'th:first-child,td:first-child{text-align:left}' +
    'th{background:#f6f3ee;font-weight:600;font-size:13.5px;color:#4a453e}' +
    'tr:last-child td{border-bottom:none}' +
    '.src{font-weight:600}' +
    '.recent th:nth-child(2),.recent td:nth-child(2){text-align:left}' +
    '.foot{margin-top:26px;font-size:13px;color:#8a847c;line-height:1.7;word-break:break-all}' +
    'a{color:#1d1b19}' +
    '@media (max-width:560px){' +
    '.wrap{padding:20px 14px 40px}' +
    'h1{font-size:21px}' +
    '.card{padding:13px 14px}.card-v{font-size:27px}' +
    'th,td{padding:9px 7px;font-size:13px}' +
    '.tbl-wrap{overflow-x:auto;-webkit-overflow-scrolling:touch}' +
    'table{font-size:13px}' +
    '}' +
    '</style></head><body><div class="wrap">' +
    '<h1>쥬드주얼리 인천 · 클릭 추적</h1>' +
    '<div class="sub">시크릿 우대 메일 링크가 몇 번, 몇 명에게서 눌렸는지 보여 줍니다. · 기준 시각 ' +
    esc(stamp(report.generated_at)) + ' (KST)</div>' +
    '<div class="grid">' +
    statCard('오늘 방문자', o.today.visitors + '명', '클릭 ' + o.today.clicks + '회 · 예약 ' + o.today.bookings + '회') +
    statCard('최근 7일 방문자', o.week.visitors + '명', '클릭 ' + o.week.clicks + '회 · 예약 ' + o.week.bookings + '회') +
    statCard('전체 방문자', o.total.visitors + '명', '클릭 ' + o.total.clicks + '회') +
    statCard('예약 버튼 누른 사람', o.total.booking_visitors + '명', '예약 클릭 ' + o.total.bookings + '회') +
    '</div>' +
    '<h2>유입 경로별</h2>' +
    '<div class="tbl-wrap"><table><thead><tr><th>유입</th><th>전체 클릭</th><th>전체 방문자</th><th>예약 클릭</th><th>7일 클릭</th><th>30일 클릭</th></tr></thead>' +
    '<tbody>' + (sourceRows || '<tr><td colspan="6">아직 기록이 없습니다.</td></tr>') + '</tbody></table></div>' +
    '<h2>최근 기록 20건</h2>' +
    '<div class="tbl-wrap"><table class="recent"><thead><tr><th>시각 (KST)</th><th>유입</th><th>동작</th></tr></thead>' +
    '<tbody>' + (recentRows || '<tr><td colspan="3">아직 기록이 없습니다.</td></tr>') + '</tbody></table></div>' +
    '<div class="foot">· <b>방문자</b>는 같은 기기에서 다시 눌러도 1명으로 셉니다(클릭 수와 다릅니다).<br>' +
    '· 메일에 넣는 주소: <b>https://jewdeincheon.com/go-booking?src=mail</b> / <b>https://jewdeincheon.com/?src=mail</b><br>' +
    '· 이 화면 주소는 외부에 공유하지 마세요. 새로 고치면 최신 집계로 바뀝니다.</div>' +
    '</div></body></html>';
}

module.exports = async (req, res) => {
  const expected = process.env.CLICK_STATS_KEY || '';
  const params = req.query || {};
  const key = params.key || '';

  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (!expected || !sameKey(key, expected)) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('접근 키가 필요합니다. (주소 끝에 ?key=발급키)');
    return;
  }

  const since = kstDayStart(RANGE_DAYS - 1).toISOString();
  let rows;
  try {
    rows = await track.query(
      '?select=created_at,source,target,visitor_id' +
        '&created_at=gte.' + encodeURIComponent(since) +
        '&order=created_at.desc&limit=5000'
    );
  } catch (e) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('집계를 불러오지 못했습니다. ' + String(e && e.message ? e.message : e));
    return;
  }

  const report = summarize(Array.isArray(rows) ? rows : []);

  if (String(params.format || '') === 'json') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(report));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(html(report));
};
