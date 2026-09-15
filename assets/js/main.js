/* =========================================================
   VOLTAGE — interactions
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. Nav: scrolled state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 20);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- 2. Mobile menu ---------- */
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");

  function closeMenu() {
    links.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });

  // Close on link tap (mobile) or Escape
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", closeMenu)
  );
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  /* ---------- 3. Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- 4. Count-up stats ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  if (counters.length) {
    if ("IntersectionObserver" in window && !prefersReduced) {
      const cio = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              cio.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((el) => cio.observe(el));
    } else {
      counters.forEach((el) => {
        el.textContent = el.dataset.count + (el.dataset.suffix || "");
      });
    }
  }

  /* ---------- 5. Cursor glow ---------- */
  const glow = document.querySelector(".cursor-glow");
  if (glow && !prefersReduced && window.matchMedia("(pointer:fine)").matches) {
    let gx = 0, gy = 0, cx = 0, cy = 0, raf = null;
    const step = () => {
      cx += (gx - cx) * 0.12;
      cy += (gy - cy) * 0.12;
      glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
      if (Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
      }
    };
    window.addEventListener("mousemove", (e) => {
      gx = e.clientX;
      gy = e.clientY;
      glow.style.opacity = "1";
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    window.addEventListener("mouseleave", () => {
      glow.style.opacity = "0";
    });
  }

  /* ---------- 6. Hero bars ---------- */
  const bars = document.querySelectorAll(".bar i");
  if (bars.length) {
    const heroIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bars.forEach((b) => (b.style.width = b.dataset.w || "80%"));
            heroIO.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    // assign a default width if none set
    bars.forEach((b, i) => {
      if (!b.dataset.w) b.dataset.w = (70 + (i * 9) % 30) + "%";
    });
    heroIO.observe(document.querySelector(".hero__card"));
  }

  /* ---------- 7. Contact form ---------- */
  const form = document.getElementById("contactForm");
  const status = document.getElementById("formStatus");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      status.classList.remove("is-error");
      if (!name || !emailOk || !message) {
        status.classList.add("is-error");
        status.textContent =
          "Please add your name, a valid email, and a few details.";
        return;
      }

      const btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "Sending…";
      status.textContent = "";

      // Netlify Forms: POST the form fields as url-encoded data to "/".
      // Netlify detects the "form-name" field, stores the submission
      // (free tier: 100/month), and returns 204. Works once the site
      // is deployed to Netlify.
      const payload = new URLSearchParams(data);
      payload.append("form-name", "contact");
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: payload.toString(),
      })
        .then((res) => {
          if (res.status === 200 || res.status === 204) {
            status.textContent = `Thanks, ${name}! We'll be in touch soon. ⚡`;
            form.reset();
          } else {
            throw new Error("send-failed");
          }
        })
        .catch(() => {
          status.classList.add("is-error");
          status.textContent =
            "Something went wrong sending that. Email hello@voltage.studio and we'll pick it up. ⚡";
        })
        .finally(() => {
          btn.disabled = false;
          btn.textContent = "Send it →";
        });
    });
  }

  /* ---------- 8. Footer year ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
