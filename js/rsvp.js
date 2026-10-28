(function () {
  "use strict";

  /**
   * Coller ici l’URL de déploiement Apps Script (Web App).
   * Exemple : https://script.google.com/macros/s/XXXX/exec
   */
  var GAS_URL =
    "https://script.google.com/macros/s/AKfycbyOPtF0MuMgtP7gx7RbPUdtQqLEHK9euyljDn1A0hWt3ZSXC2ZppsBNnitB8KUC8CbO/exec";

  function getInvite() {
    return (window.MFSInvite && window.MFSInvite.get && window.MFSInvite.get()) || null;
  }

  function toggleChildren(form) {
    var yes = form.querySelector('input[name="enfants"][value="oui"]');
    var fields = form.querySelector(".children-fields");
    var nb = form.querySelector('input[name="nb_enfants"]');
    if (!fields) return;

    var show = !!(yes && yes.checked);
    fields.hidden = !show;
    if (nb) {
      nb.required = show;
      if (!show) nb.value = "";
    }
  }

  function setStatus(form, message, kind) {
    var el = form.querySelector(".form__status");
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("is-ok", "is-err");
    if (kind) el.classList.add(kind);
  }

  function isAttending(participation) {
    return (
      participation === "oui" ||
      participation === "civil" ||
      participation === "religieux" ||
      participation === "les-deux"
    );
  }

  function collectPayload(form) {
    var invite = getInvite();
    var data = new FormData(form);
    var enfants = data.get("enfants") || "non";
    var nb = data.get("nb_enfants");
    var participation = String(data.get("participation") || "");

    return {
      parcours: invite ? invite.id : "",
      evenement: form.getAttribute("data-evenement") || "",
      nom: String(data.get("nom") || "").trim(),
      email: String(data.get("email") || "").trim(),
      telephone: String(data.get("telephone") || "").trim(),
      participation: participation,
      enfants: isAttending(participation) ? String(enfants) : "non",
      nb_enfants:
        isAttending(participation) && enfants === "oui" ? String(nb || "") : "",
      allergies: String(data.get("allergies") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  }

  function validate(payload) {
    if (!payload.nom) return "Indiquez votre nom.";
    if (!payload.participation) return "Indiquez votre participation.";
    if (isAttending(payload.participation)) {
      if (!payload.enfants) return "Indiquez si vous venez avec des enfants.";
      if (payload.enfants === "oui") {
        var n = Number(payload.nb_enfants);
        if (!n || n < 1) return "Indiquez le nombre d’enfants.";
      }
    }
    return "";
  }

  function toggleAttendanceFields(form) {
    var selected = form.querySelector('input[name="participation"]:checked');
    var attending = !!(selected && isAttending(selected.value));
    var extras = form.querySelectorAll("[data-if-attending]");
    extras.forEach(function (el) {
      el.hidden = !attending;
    });
    if (!attending) {
      var fields = form.querySelector(".children-fields");
      var nb = form.querySelector('input[name="nb_enfants"]');
      if (fields) fields.hidden = true;
      if (nb) {
        nb.required = false;
        nb.value = "";
      }
    } else {
      toggleChildren(form);
    }
  }

  async function submitToGas(payload) {
    if (!GAS_URL) {
      throw new Error(
        "Le formulaire n’est pas encore connecté (GAS_URL manquant). Réessayez bientôt."
      );
    }

    // text/plain évite un preflight CORS strict avec Apps Script
    var res = await fetch(GAS_URL, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    var bodyText = await res.text();
    var json = null;
    try {
      json = JSON.parse(bodyText);
    } catch (e) {
      json = null;
    }

    if (!res.ok || (json && json.ok === false)) {
      throw new Error((json && json.error) || "Envoi impossible pour le moment.");
    }

    return json;
  }

  function bindForm(form) {
    form.querySelectorAll('input[name="enfants"]').forEach(function (input) {
      input.addEventListener("change", function () {
        toggleChildren(form);
      });
    });
    form.querySelectorAll('input[name="participation"]').forEach(function (input) {
      input.addEventListener("change", function () {
        toggleAttendanceFields(form);
      });
    });
    toggleAttendanceFields(form);

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      setStatus(form, "", null);

      var payload = collectPayload(form);
      var error = validate(payload);
      if (error) {
        setStatus(form, error, "is-err");
        return;
      }

      var button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      setStatus(form, "Envoi en cours…", null);

      try {
        await submitToGas(payload);
        setStatus(form, "Merci ! Votre réponse a bien été enregistrée.", "is-ok");
        form.reset();
        toggleAttendanceFields(form);
      } catch (err) {
        setStatus(
          form,
          (err && err.message) || "Une erreur est survenue. Réessayez plus tard.",
          "is-err"
        );
      } finally {
        if (button) button.disabled = false;
      }
    });
  }

  function init() {
    document.querySelectorAll("form.rsvp-form").forEach(bindForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
