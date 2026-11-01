(function () {
  "use strict";

  /**
   * Coller ici l’URL de déploiement Apps Script (Web App).
   * Exemple : https://script.google.com/macros/s/XXXX/exec
   */
  var GAS_URL =
    "https://script.google.com/macros/s/AKfycbxjI9XsSYZuQFRZuBkE4o9aJLgeer85kSauY6Ch0AneuGkTruvzQfY82ydH4HzuN9I/exec";

  var PARTICIPATION_LABELS = {
    oui: "Oui",
    non: "Non",
    "les-deux": "Aux deux événements",
    civil: "Mariage civil seulement (5 juin)",
    religieux: "Célébration seulement (17 juillet)",
    aucun: "À aucun des deux",
  };

  var EVENEMENT_LABELS = {
    civil: "Mariage civil",
    religieux: "Célébration",
    combined: "Les deux événements",
  };

  var pending = null;

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

  function collectPayload(form) {
    var invite = getInvite();
    var data = new FormData(form);
    var enfants = data.get("enfants") || "";
    var nb = data.get("nb_enfants");
    var participation = String(data.get("participation") || "");
    var evenement = form.getAttribute("data-evenement") || "";
    var brunch = "";

    if (
      evenement === "religieux" ||
      (evenement === "combined" &&
        (participation === "religieux" || participation === "les-deux"))
    ) {
      brunch = String(data.get("brunch") || "");
    }

    return {
      parcours: invite ? invite.id : "",
      evenement: evenement,
      nom: String(data.get("nom") || "").trim(),
      email: String(data.get("email") || "").trim(),
      telephone: String(data.get("telephone") || "").trim(),
      participation: participation,
      brunch: brunch,
      enfants: String(enfants),
      nb_enfants: enfants === "oui" ? String(nb || "") : "",
      allergies: String(data.get("allergies") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  }

  function validate(payload, form) {
    if (!payload.nom) return "Indiquez votre nom.";
    if (!payload.participation) return "Indiquez votre participation.";
    if (!payload.enfants) return "Indiquez si vous venez avec ou sans enfants.";
    if (payload.enfants === "oui") {
      var n = Number(payload.nb_enfants);
      if (!n || n < 1) return "Indiquez le nombre d’enfants.";
    }

    var brunchFields = form.querySelectorAll('input[name="brunch"]');
    if (brunchFields.length) {
      var evenement = payload.evenement;
      var needsBrunch =
        evenement === "religieux" ||
        (evenement === "combined" &&
          (payload.participation === "religieux" ||
            payload.participation === "les-deux"));
      if (needsBrunch && !payload.brunch) {
        return "Indiquez si vous serez présents au brunch du dimanche.";
      }
    }

    return "";
  }

  function toggleAttendanceFields(form) {
    var selected = form.querySelector('input[name="participation"]:checked');
    var participation = selected ? selected.value : "";
    var evenement = form.getAttribute("data-evenement") || "";

    var showBrunch =
      evenement === "religieux" ||
      (evenement === "combined" &&
        (participation === "religieux" || participation === "les-deux"));

    form.querySelectorAll("[data-if-brunch]").forEach(function (el) {
      el.hidden = !showBrunch;
    });

    var showMeals =
      evenement === "religieux" ||
      (evenement === "combined" &&
        (participation === "religieux" || participation === "les-deux"));

    form.querySelectorAll("[data-if-meals]").forEach(function (el) {
      el.hidden = !showMeals;
      if (!showMeals) {
        var allergy = el.querySelector('input[name="allergies"]');
        if (allergy) allergy.value = "";
      }
    });

    toggleChildren(form);
  }

  function participationLabel(payload) {
    if (payload.evenement === "civil" || payload.evenement === "religieux") {
      var eventName = EVENEMENT_LABELS[payload.evenement] || payload.evenement;
      return (
        eventName +
        " — " +
        (PARTICIPATION_LABELS[payload.participation] || payload.participation)
      );
    }
    return PARTICIPATION_LABELS[payload.participation] || payload.participation;
  }

  function buildRecapRows(payload) {
    var rows = [
      { label: "Nom", value: payload.nom },
      { label: "Participation", value: participationLabel(payload) },
    ];

    if (payload.brunch) {
      rows.push({
        label: "Brunch du dimanche 18",
        value: payload.brunch === "oui" ? "Oui" : "Non",
      });
    }

    rows.push({
      label: "Enfants",
      value:
        payload.enfants === "oui"
          ? "Avec enfants (" + payload.nb_enfants + ")"
          : "Sans enfants",
    });

    if (payload.email) rows.push({ label: "E-mail", value: payload.email });
    if (payload.telephone) {
      rows.push({ label: "Téléphone", value: payload.telephone });
    }
    if (payload.allergies) {
      rows.push({ label: "Allergies / régimes", value: payload.allergies });
    }
    if (payload.message) {
      rows.push({ label: "Message", value: payload.message });
    }

    return rows;
  }

  function ensureRecapModal() {
    var existing = document.getElementById("rsvp-recap");
    if (existing) return existing;

    var root = document.createElement("div");
    root.id = "rsvp-recap";
    root.className = "rsvp-recap";
    root.hidden = true;
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-labelledby", "rsvp-recap-title");
    root.innerHTML =
      '<div class="rsvp-recap__backdrop" data-recap-close="1"></div>' +
      '<div class="rsvp-recap__panel">' +
      '<h2 id="rsvp-recap-title">Récapitulatif</h2>' +
      "<p>Vérifiez vos réponses avant l’envoi.</p>" +
      '<ul class="rsvp-recap__list" id="rsvp-recap-list"></ul>' +
      '<div class="rsvp-recap__actions">' +
      '<button type="button" class="btn btn--outline" data-recap-close="1">Modifier</button>' +
      '<button type="button" class="btn" id="rsvp-recap-confirm">Confirmer l’envoi</button>' +
      "</div>" +
      "</div>";

    document.body.appendChild(root);

    root.addEventListener("click", function (event) {
      var target = event.target;
      if (target && target.getAttribute && target.getAttribute("data-recap-close")) {
        closeRecap();
      }
    });

    document
      .getElementById("rsvp-recap-confirm")
      .addEventListener("click", confirmRecap);

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !root.hidden) closeRecap();
    });

    return root;
  }

  function openRecap(form, payload) {
    var root = ensureRecapModal();
    var list = document.getElementById("rsvp-recap-list");
    list.innerHTML = "";

    buildRecapRows(payload).forEach(function (row) {
      var li = document.createElement("li");
      li.innerHTML =
        '<span class="label"></span><span class="value"></span>';
      li.querySelector(".label").textContent = row.label;
      li.querySelector(".value").textContent = row.value;
      list.appendChild(li);
    });

    pending = { form: form, payload: payload };
    root.hidden = false;
    document.getElementById("rsvp-recap-confirm").focus();
  }

  function closeRecap() {
    var root = document.getElementById("rsvp-recap");
    if (root) root.hidden = true;
    pending = null;
  }

  async function confirmRecap() {
    if (!pending) return;

    var form = pending.form;
    var payload = pending.payload;
    var button = form.querySelector('button[type="submit"]');
    var confirmBtn = document.getElementById("rsvp-recap-confirm");

    if (button) button.disabled = true;
    if (confirmBtn) confirmBtn.disabled = true;
    setStatus(form, "Envoi en cours…", null);

    try {
      await submitToGas(payload);
      closeRecap();
      setStatus(form, "Merci ! Votre réponse a bien été enregistrée.", "is-ok");
      form.reset();
      toggleAttendanceFields(form);
    } catch (err) {
      closeRecap();
      setStatus(
        form,
        (err && err.message) || "Une erreur est survenue. Réessayez plus tard.",
        "is-err"
      );
    } finally {
      if (button) button.disabled = false;
      if (confirmBtn) confirmBtn.disabled = false;
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

    if (!res.ok || !json || json.ok !== true) {
      throw new Error(
        (json && json.error) ||
          "Envoi impossible pour le moment. Vérifie le déploiement Apps Script."
      );
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

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setStatus(form, "", null);

      var payload = collectPayload(form);
      var error = validate(payload, form);
      if (error) {
        setStatus(form, error, "is-err");
        return;
      }

      openRecap(form, payload);
    });
  }

  function init() {
    ensureRecapModal();
    document.querySelectorAll("form.rsvp-form").forEach(bindForm);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
