/* =========================================================
   JEWDE JEWELRY INCHEON — script
   ========================================================= */

(function () {
  "use strict";

  const header = document.querySelector(".site-header");
  const nav = document.getElementById("nav");
  const menuToggle = document.getElementById("menuToggle");

  /* ---------- header state ---------- */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const closeMenu = () => {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "메뉴 열기");
    document.body.classList.remove("menu-open");
  };

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      document.body.classList.toggle("menu-open", open);
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  /* ---------- reveal on scroll ---------- */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- nav scroll spy ---------- */
  const sectionIds = ["about", "atelier", "promise", "channel", "faq", "visit"];
  const navLinks = Array.from(document.querySelectorAll("#nav a")).filter(
    (a) => !a.classList.contains("nav-cta")
  );
  const linkFor = (id) => navLinks.find((a) => a.getAttribute("href") === "#" + id);

  if ("IntersectionObserver" in window && navLinks.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove("is-active"));
          const link = linkFor(entry.target.id);
          if (link) link.classList.add("is-active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) spy.observe(el);
    });
  }

  /* ---------- 메일·링크 유입 추적 ---------- */
  (function trackClicks() {
    try {
      const params = new URLSearchParams(window.location.search);
      const clean = (v) =>
        String(v || "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_-]/g, "")
          .slice(0, 32);
      const incoming = clean(params.get("src") || params.get("from"));

      if (incoming) {
        try {
          sessionStorage.setItem("jewde_src", incoming);
        } catch (e) {}
      }

      let stored = "";
      try {
        stored = sessionStorage.getItem("jewde_src") || "";
      } catch (e) {}
      const src = incoming || stored;

      const beacon = (target) => {
        const url =
          "/api/track?target=" +
          encodeURIComponent(target) +
          "&src=" +
          encodeURIComponent(src || "direct");
        if (navigator.sendBeacon) {
          try {
            navigator.sendBeacon(url, new Blob(["1"], { type: "text/plain" }));
            return;
          } catch (e) {}
        }
        fetch(url, { method: "POST", keepalive: true }).catch(() => {});
      };

      // 메일 링크(?src=mail)로 들어온 경우 방문 1회 기록 — 같은 탭에서 새로 고쳐도 1회
      if (incoming) {
        const flag = "jewde_landing_" + incoming;
        let seen = false;
        try {
          seen = sessionStorage.getItem(flag) === "1";
        } catch (e) {}
        if (!seen) {
          try {
            sessionStorage.setItem(flag, "1");
          } catch (e) {}
          beacon("landing");
        }
      }

      // 네이버 예약 버튼을 누르면 기록 (메일 유입이 아니면 direct 로 남습니다)
      document.querySelectorAll('a[href*="booking.naver.com"]').forEach((a) => {
        a.addEventListener("click", () => beacon("naver_booking"));
      });
    } catch (e) {}
  })();

  /* ---------- FAQ: 한 번에 하나만 열기 ---------- */
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
