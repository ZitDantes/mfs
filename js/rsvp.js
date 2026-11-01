(function () {
  "use strict";

  /**
   * Coller ici l’URL de déploiement Apps Script (Web App).
   * Exemple : https://script.google.com/macros/s/XXXX/exec
   */
  var GAS_URL =
    "https://script.google.com/macros/s/AKfycbyxd6gmPD5oN6eG9LhGEEFNWhZJJ6Hktlcv5OK9s_cYlXyr6ucJZIIZRC5uLhWr3mkm/exec";

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

  function getOrCreateRecap(form) {
    var recap = form.querySelector(".form__recap");
    if (recap) return recap;

    recap = document.createElement("div");
    recap.className = "form__recap";
    recap.hidden = true;
    recap.innerHTML =
      "<h3>Recapitulatif de vos reponses</h3>" +
      "<p class=\"form__recap-lead\">Verifiez les informations ci-dessous avant l envoi definitif.</p>" +
      '<ul class="form__recap-list"></ul>' +
      '<div class="form__recap-actions">' +
      '<button type="button" class="btn btn--outline form__recap-edit">Modifier</button>' +
      '<button type="button" class="btn form__recap-confirm">Confirmer l envoi</button>' +
      "</div>";

    // Use proper French accents via textContent after insert
    form.appendChild(recap);
    recap.querySelector("h3").textContent = "Récapitulatif de vos réponses";
    recap.querySelector(".form__recap-lead").textContent =
      "Vérifiez les informations ci-dessous avant l’envoi définitif.";
    recap.querySelector(".form__recap-confirm").textContent = "Confirmer l’envoi";

    recap.querySelector(".form__recap-edit").addEventListener("click", function () {
      hideRecap(form);
    });

    recap
      .querySelector(".form__recap-confirm")
      .addEventListener("click", function () {
        confirmRecap(form);
      });

    return recap;
  }

  function hideFormFields(form) {
    Array.prototype.forEach.call(form.children, function (child) {
      if (
        child.classList.contains("form__recap") ||
        child.classList.contains("form__status")
      ) {
        return;
      }
      child.dataset.wasHidden = child.hidden ? "1" : "0";
      child.hidden = true;
    });
  }

  function restoreFormFields(form) {
    Array.prototype.forEach.call(form.children, function (child) {
      if (
        child.classList.contains("form__recap") ||
        child.classList.contains("form__status")
      ) {
        return;
      }
      if (child.dataset.wasHidden === "0") child.hidden = false;
      else if (child.dataset.wasHidden === "1") child.hidden = true;
      delete child.dataset.wasHidden;
    });
    toggleAttendanceFields(form);
  }

  function showRecap(form, payload) {
    var recap = getOrCreateRecap(form);
    var list = recap.querySelector(".form__recap-list");
    list.innerHTML = "";

    buildRecapRows(payload).forEach(function (row) {
      var li = document.createElement("li");
      var label = document.createElement("span");
      var value = document.createElement("span");
      label.className = "label";
      value.className = "value";
      label.textContent = row.label;
      value.textContent = row.value;
      li.appendChild(label);
      li.appendChild(value);
      list.appendChild(li);
    });

    form._rsvpPayload = payload;
    hideFormFields(form);
    recap.hidden = false;
    setStatus(form, "", null);
    recap.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function hideRecap(form) {
    var recap = form.querySelector(".form__recap");
    if (recap) recap.hidden = true;
    form._rsvpPayload = null;
    restoreFormFields(form);
  }

  async function confirmRecap(form) {
    var payload = form._rsvpPayload;
    if (!payload) return;

    var confirmBtn = form.querySelector(".form__recap-confirm");
    var editBtn = form.querySelector(".form__recap-edit");
    if (confirmBtn) confirmBtn.disabled = true;
    if (editBtn) editBtn.disabled = true;
    setStatus(form, "Envoi en cours…", null);

    try {
      await submitToGas(payload);
      hideRecap(form);
      setStatus(form, "Merci ! Votre réponse a bien été enregistrée.", "is-ok");
      form.reset();
      toggleAttendanceFields(form);
    } catch (err) {
      setStatus(
        form,
        (err && err.message) || "Une erreur est survenue. Réessayez plus tard.",
        "is-err"
      );
      // Keep recap visible so the guest can retry or edit
    } finally {
      if (confirmBtn) confirmBtn.disabled = false;
      if (editBtn) editBtn.disabled = false;
    }
  }

  async function submitToGas(payload) {
    if (!GAS_URL) {
      throw new Error(
        "Le formulaire n’est pas encore connecté (GAS_URL manquant). Réessayez bientôt."
      );
    }

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
    getOrCreateRecap(form);

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

      showRecap(form, payload);
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
