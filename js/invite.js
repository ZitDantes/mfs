(function () {
  "use strict";

  var STORAGE_KEY = "mfs-invite";

  var INVITES = {
    epinay: {
      id: "epinay",
      label: "civil",
      canCivil: true,
      canReligieux: false,
    },
    brosse: {
      id: "brosse",
      label: "religieux",
      canCivil: false,
      canReligieux: true,
    },
    "20ans": {
      id: "20ans",
      label: "les-deux",
      canCivil: true,
      canReligieux: true,
    },
  };

  function normalizeCode(raw) {
    return String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  function getStoredInvite() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || !parsed.id || !INVITES[parsed.id]) return null;
      return INVITES[parsed.id];
    } catch (e) {
      return null;
    }
  }

  function storeInvite(invite) {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ id: invite.id, at: Date.now() })
    );
  }

  function resolveFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var code = normalizeCode(params.get("i"));
    if (!code) return null;
    return INVITES[code] || null;
  }

  function currentPage() {
    var path = window.location.pathname.replace(/\/+$/, "");
    var file = path.split("/").pop() || "index.html";
    if (file === "" || file === "mfs") return "index.html";
    return file;
  }

  function pageAllowed(invite, page) {
    if (page === "index.html" || page === "infos.html") return true;
    if (page === "civil.html") return !!invite.canCivil;
    if (page === "religieux.html") return !!invite.canReligieux;
    return true;
  }

  function cleanInviteParam() {
    if (!window.location.search) return;
    var url = new URL(window.location.href);
    if (!url.searchParams.has("i")) return;
    url.searchParams.delete("i");
    var next = url.pathname + (url.search || "") + url.hash;
    window.history.replaceState({}, "", next);
  }

  function showGate() {
    var gate = document.getElementById("invite-gate");
    var site = document.getElementById("site");
    if (gate) gate.hidden = false;
    if (site) site.hidden = true;
  }

  function showSite() {
    var gate = document.getElementById("invite-gate");
    var site = document.getElementById("site");
    if (gate) gate.hidden = true;
    if (site) site.hidden = false;
  }

  function applyNav(invite) {
    document.querySelectorAll("[data-nav-civil]").forEach(function (el) {
      el.hidden = !invite.canCivil;
    });
    document.querySelectorAll("[data-nav-religieux]").forEach(function (el) {
      el.hidden = !invite.canReligieux;
    });

    var page = currentPage();
    document.querySelectorAll(".nav a[href]").forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var target = href.split("?")[0].split("/").pop();
      if (target === page) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function applyVisibility(invite) {
    document.querySelectorAll("[data-show-civil]").forEach(function (el) {
      el.hidden = !invite.canCivil;
    });
    document.querySelectorAll("[data-show-religieux]").forEach(function (el) {
      el.hidden = !invite.canReligieux;
    });
    document.querySelectorAll("[data-show-both]").forEach(function (el) {
      el.hidden = !(invite.canCivil && invite.canReligieux);
    });
    document.querySelectorAll("[data-show-civil-only]").forEach(function (el) {
      el.hidden = !(invite.canCivil && !invite.canReligieux);
    });
    document.querySelectorAll("[data-show-religieux-only]").forEach(function (el) {
      el.hidden = !(!invite.canCivil && invite.canReligieux);
    });

    document.body.dataset.invite = invite.id;
  }

  function bindGateForm() {
    var form = document.getElementById("invite-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var input = document.getElementById("invite-code");
      var error = document.getElementById("invite-error");
      var code = normalizeCode(input && input.value);
      var invite = INVITES[code];

      if (!invite) {
        if (error) {
          error.textContent =
            "Code non reconnu. Vérifiez votre invitation et réessayez.";
        }
        return;
      }

      storeInvite(invite);
      if (error) error.textContent = "";
      bootWithInvite(invite, false);
    });
  }

  function bootWithInvite(invite, fromQuery) {
    var page = currentPage();

    if (!pageAllowed(invite, page)) {
      window.location.replace("index.html");
      return;
    }

    if (fromQuery) cleanInviteParam();

    showSite();
    applyNav(invite);
    applyVisibility(invite);

    document.dispatchEvent(
      new CustomEvent("mfs:invite-ready", { detail: { invite: invite } })
    );
  }

  function init() {
    bindGateForm();

    var fromQuery = resolveFromQuery();
    if (fromQuery) {
      storeInvite(fromQuery);
      bootWithInvite(fromQuery, true);
      return;
    }

    var stored = getStoredInvite();
    if (stored) {
      bootWithInvite(stored, false);
      return;
    }

    showGate();
  }

  window.MFSInvite = {
    get: getStoredInvite,
    codes: Object.keys(INVITES),
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
