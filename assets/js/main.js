(() => {
  const body = document.body;
  const currentFile = window.location.pathname.split("/").pop() || "index.html";

  const setCurrentYear = () => {
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  };

  const initNav = () => {
    const nav = document.querySelector("#main-nav");
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelectorAll("[data-nav]");

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === currentFile) {
        link.classList.add("is-active");
      }
    });

    if (!menuToggle || !nav) return;

    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
    });

    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        menuToggle.setAttribute("aria-expanded", "false");
        nav.classList.remove("is-open");
      });
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      const target = event.target;
      if (target instanceof Node && !nav.contains(target) && !menuToggle.contains(target)) {
        nav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  };

  const initReveal = () => {
    const revealItems = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || !revealItems.length) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16 }
    );

    revealItems.forEach((item) => observer.observe(item));
  };

  const initPortfolioFilter = () => {
    const controls = document.querySelectorAll(".portfolio-filter [data-filter]");
    const cards = document.querySelectorAll(".project-card[data-category]");
    if (!controls.length || !cards.length) return;

    controls.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.getAttribute("data-filter");
        controls.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");

        cards.forEach((card) => {
          const categories = (card.getAttribute("data-category") || "").split(" ");
          const shouldShow = filter === "all" || categories.includes(filter);
          card.classList.toggle("is-hidden", !shouldShow);
        });
      });
    });
  };

  const initProjectCardLinks = () => {
    const cards = document.querySelectorAll(".project-card[data-project-url]");
    if (!cards.length) return;

    cards.forEach((card) => {
      const url = card.getAttribute("data-project-url");
      if (!url) return;

      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");

      const openProject = () => window.open(url, "_blank", "noopener");

      card.addEventListener("click", (event) => {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest("a, button, input, textarea, select, option, label")) return;
        openProject();
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        openProject();
      });
    });
  };


  const initCardInteractions = () => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const cards = document.querySelectorAll(".card:not(.card-soft)");
    if (!cards.length) return;

    cards.forEach((card) => {
      const onPointerMove = (event) => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const percentX = ((event.clientX - rect.left) / rect.width) * 100;
        const percentY = ((event.clientY - rect.top) / rect.height) * 100;
        const rotateY = (percentX - 50) / 7;
        const rotateX = (50 - percentY) / 7;

        card.style.setProperty("--mx", `${Math.max(0, Math.min(100, percentX))}%`);
        card.style.setProperty("--my", `${Math.max(0, Math.min(100, percentY))}%`);
        card.style.transform = `translateY(-10px) scale(1.013) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
      };

      const resetCard = () => {
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
        card.style.removeProperty("transform");
      };

      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerleave", resetCard);
      card.addEventListener("pointercancel", resetCard);
    });
  };

  const formatPln = (value) =>
    `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 0 }).format(value)} zł`;

  const initPricingCalculator = () => {
    const form = document.querySelector("#pricing-calculator");
    if (!form) return;

    const typeSelect = form.querySelector("#siteType");
    const pagesRange = form.querySelector("#pagesRange");
    const pagesValue = form.querySelector("#pagesValue");
    const pagesField = form.querySelector("#pagesField");
    const pagesHint = form.querySelector("#pagesHint");
    const setupOutput = form.querySelector("#estimateSetup");
    const monthlyOutput = form.querySelector("#estimateMonthly");
    const options = form.querySelectorAll("input[type='checkbox'][data-extra-cost]");

    if (
      !typeSelect ||
      !pagesRange ||
      !pagesValue ||
      !setupOutput ||
      !monthlyOutput ||
      !options.length
    ) {
      return;
    }

    const getPerPagePrice = (planId) => {
      if (planId === "firmowa") return 120;
      if (planId === "rozbudowany") return 150;
      return 0;
    };

    const getMonthlyFromBase = (basePrice) => {
      if (basePrice <= 800) return 40;
      if (basePrice <= 1600) return 60;
      return 90;
    };

    const getPlanId = () => {
      const selected = typeSelect.options[typeSelect.selectedIndex];
      return selected ? selected.getAttribute("data-plan") || "" : "";
    };

    const syncPagesState = () => {
      const isOnePage = getPlanId() === "onepage";
      const isFirmowa = getPlanId() === "firmowa";
      const isRozbudowany = getPlanId() === "rozbudowany";

      if (isOnePage) {
        pagesRange.value = "1";
        pagesRange.min = "1";
        pagesRange.max = "1";
        pagesRange.disabled = true;
        pagesField?.classList.add("is-locked");
        if (pagesHint) pagesHint.hidden = false;
        if (pagesHint) pagesHint.textContent = "Dla One Page liczba podstron jest stała: 1.";
      } else if (isFirmowa) {
        pagesRange.disabled = false;
        pagesRange.min = "3";
        pagesRange.max = "6";
        if (Number(pagesRange.value) < 3 || Number(pagesRange.value) > 6) {
          pagesRange.value = "3";
        }
        pagesField?.classList.remove("is-locked");
        if (pagesHint) pagesHint.hidden = false;
        if (pagesHint) pagesHint.textContent = "Strona firmowa: zakres 3-6 podstron. Cena bazowa obejmuje 3.";
      } else if (isRozbudowany) {
        pagesRange.disabled = false;
        pagesRange.min = "6";
        pagesRange.max = "12";
        if (Number(pagesRange.value) < 6 || Number(pagesRange.value) > 12) {
          pagesRange.value = "6";
        }
        pagesField?.classList.remove("is-locked");
        if (pagesHint) pagesHint.hidden = false;
        if (pagesHint) pagesHint.textContent = "Serwis rozbudowany: zakres 6-12 podstron. Cena bazowa obejmuje 6.";
      } else {
        pagesRange.disabled = false;
        pagesRange.min = "1";
        pagesRange.max = "12";
        if (Number(pagesRange.value) < 2) {
          pagesRange.value = "3";
        }
        pagesField?.classList.remove("is-locked");
        if (pagesHint) pagesHint.hidden = true;
      }

      return isOnePage;
    };

    const recalc = () => {
      const isOnePage = syncPagesState();
      const planId = getPlanId();
      const basePrice = Number(typeSelect.value);
      const pageCount = Number(pagesRange.value);
      const includedPages = isOnePage ? 1 : planId === "firmowa" ? 3 : planId === "rozbudowany" ? 6 : 1;
      const additionalPages = isOnePage ? 0 : Math.max(0, pageCount - includedPages);
      const pagesCost = additionalPages * getPerPagePrice(planId);
      const extrasCost = [...options].reduce((sum, option) => {
        if (!option.checked) return sum;
        return sum + Number(option.getAttribute("data-extra-cost") || 0);
      }, 0);

      const setupTotal = basePrice + pagesCost + extrasCost;
      const monthly = getMonthlyFromBase(basePrice) + (extrasCost > 0 ? 5 : 0);

      pagesValue.textContent = isOnePage ? "1 (stałe)" : String(pageCount);
      setupOutput.textContent = formatPln(setupTotal);
      monthlyOutput.textContent = `od ${formatPln(monthly)} / mies.`;
    };

    typeSelect.addEventListener("change", recalc);
    pagesRange.addEventListener("input", recalc);
    options.forEach((option) => option.addEventListener("change", recalc));
    recalc();
  };

  const initContactForm = () => {
    const form = document.querySelector("#contact-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const data = new FormData(form);
      const safe = (key) => (data.get(key) || "").toString().trim();
      const lines = [
        "Nowe zapytanie ze strony invessly.io",
        "",
        `Imię i nazwisko: ${safe("name")}`,
        `E-mail: ${safe("email")}`,
        `Branża: ${safe("industry")}`,
        `Budżet: ${safe("budget")}`,
        `Typ projektu: ${safe("scope")}`,
        `Termin startu: ${safe("timeline") || "nie podano"}`,
        "",
        "Wiadomość:",
        safe("message"),
      ];

      const subject = encodeURIComponent(`Zapytanie ofertowe - ${safe("scope") || "strona internetowa"}`);
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = `mailto:mateusz@invessly.io?subject=${subject}&body=${body}`;
    });
  };

  setCurrentYear();
  initNav();
  initReveal();
  initPortfolioFilter();
  initProjectCardLinks();
  initCardInteractions();
  initPricingCalculator();
  initContactForm();

  if (body.dataset.page) {
    body.classList.add(`page-${body.dataset.page}`);
  }
})();
