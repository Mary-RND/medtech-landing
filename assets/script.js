/* ============================================================
   MedTech-лендинг Марины Петрушиной
   Навигация, появление блоков, форма-письмо
   ============================================================ */
(function () {
  "use strict";

  var EMAIL = "mar.petrushina@yandex.ru";

  /* ---------- Шапка ---------- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 12) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");

  function closeNav() {
    nav.classList.remove("is-open");
    burger.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  }

  burger.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) closeNav();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  /* ---------- Активный раздел ---------- */
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a:not(.nav-cta)"));
  var sections = navLinks
    .map(function (a) {
      var href = a.getAttribute("href");
      return href && href.charAt(0) === "#" ? document.querySelector(href) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (a) {
            a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* ---------- Появление блоков ---------- */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.body.classList.add("reveal-ready");
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry, index) {
          if (entry.isIntersecting) {
            entry.target.style.setProperty("--delay", (index % 3) * 0.07 + "s");
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- Форма: письмо в почтовом клиенте ---------- */
  var form = document.getElementById("lead-form");
  var status = document.getElementById("form-status");
  var copyBtn = document.getElementById("copy-lead");

  function setStatus(text, isError) {
    status.textContent = text;
    status.classList.toggle("is-error", !!isError);
  }

  function markError(field, hasError) {
    var wrap = field.closest(".field");
    if (wrap) wrap.classList.toggle("has-error", hasError);
  }

  function leadData() {
    return {
      name: form.elements.name.value.trim(),
      contact: form.elements.contact.value.trim(),
      task: form.elements.task.value,
      budget: form.elements.budget.value || "не указан",
      message: form.elements.message.value.trim() || "—"
    };
  }

  function leadText(data) {
    return [
      "Имя: " + data.name,
      "Контакт: " + data.contact,
      "Задача: " + data.task,
      "Бюджет: " + data.budget,
      "",
      "Описание:",
      data.message
    ].join("\n");
  }

  function mailtoHref(data) {
    return (
      "mailto:" +
      EMAIL +
      "?subject=" +
      encodeURIComponent("Заявка с MedTech-лендинга: " + data.task) +
      "&body=" +
      encodeURIComponent(leadText(data))
    );
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(area);
      }
    });
  }

  function validateLead() {
    var valid = true;
    [form.elements.name, form.elements.contact, form.elements.task].forEach(function (field) {
      var bad = !field.value.trim();
      markError(field, bad);
      if (bad) valid = false;
    });
    return valid ? leadData() : null;
  }

  if (form) {
    form.addEventListener("input", function (e) {
      if (e.target.matches("input, select, textarea")) markError(e.target, false);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = validateLead();
      if (!data) {
        setStatus("Заполните имя, контакт и тип задачи — этого достаточно.", true);
        return;
      }
      window.location.href = mailtoHref(data);
      setStatus(
        "Открываю почтовый клиент с готовым письмом. Если он не открылся — нажмите «Скопировать заявку» и отправьте на " +
          EMAIL +
          ".",
        false
      );
    });

    if (copyBtn) {
      copyBtn.addEventListener("click", function () {
        var data = validateLead();
        if (!data) {
          setStatus("Заполните имя, контакт и тип задачи — этого достаточно.", true);
          return;
        }
        copyText(leadText(data))
          .then(function () {
            setStatus("Заявка скопирована. Вставьте её в письмо на " + EMAIL + " или в Telegram.", false);
            copyBtn.textContent = "Скопировано";
            setTimeout(function () {
              copyBtn.textContent = "Скопировать заявку";
            }, 2500);
          })
          .catch(function () {
            setStatus("Не получилось скопировать автоматически. Выделите текст заявки и скопируйте вручную.", true);
          });
      });
    }
  }

  /* ---------- Выбор пакета в форме ---------- */
  document.querySelectorAll("[data-plan]").forEach(function (link) {
    link.addEventListener("click", function () {
      var plan = link.getAttribute("data-plan");
      var message = document.getElementById("message");
      if (message && !message.value) {
        message.value = "Интересует пакет «" + plan + "». Задача: ";
      }
    });
  });
})();
