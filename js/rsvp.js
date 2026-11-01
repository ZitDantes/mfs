(function () {
  "use strict";

  /**
   * Coller ici l’URL de déploiement Apps Script (Web App).
   * Exemple : https://script.google.com/macros/s/XXXX/exec
   */
  var GAS_URL =
    "https://script.google.com/macros/s/AKfycbzdFKeB2DrsbssVLp48gKs_XokFaMB2O5Uhm88uDjFcaeL7GtiWm4OAfBNdEPdDskfm/exec";

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

  function togglePlusUn(form) {
    var yes = form.querySelector('input[name="plus_un"][value="oui"]');
    var fields = form.querySelector(".plus1-fields");
    var nom = form.querySelector('input[name="plus_un_nom"]');
    if (!fields) return;

    var show = !!(yes && yes.checked);
    fields.hidden = !show;
    if (nom) {
      nom.required = show;
      if (!show) nom.value = "";
    }
  }

  function setStatus(form, message, kind) {
    var el = form.querySelector(".form__status");
    if (!el) return;
    el.textContent = message || "";
    el.classList.remove("is-ok", "is-err");
    if (kind) el.classList.add(kind);
  }

  function isComing(participation) {
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
    var enfants = data.get("enfants") || "";
    var nb = data.get("nb_enfants");
    var participation = String(data.get("participation") || "");
    var evenement = form.getAttribute("data-evenement") || "";
    var coming = isComing(participation);
    var brunch = "";

    if (
      evenement === "religieux" ||
      (evenement === "combined" &&
        (participation === "religieux" || participation === "les-deux"))
    ) {
      brunch = String(data.get("brunch") || "");
    }

    var plusUn = coming ? String(data.get("plus_un") || "") : "";
    var plusUnNom = String(data.get("plus_un_nom") || "").trim();

    return {
      parcours: invite ? invite.id : "",
      evenement: evenement,
      nom: String(data.get("nom") || "").trim(),
      plus_un: plusUn,
      plus_un_nom: plusUn === "oui" ? plusUnNom : "",
      email: String(data.get("email") || "").trim(),
      telephone: String(data.get("telephone") || "").trim(),
      participation: participation,
      brunch: brunch,
      enfants: coming ? String(enfants) : "",
      nb_enfants: coming && enfants === "oui" ? String(nb || "") : "",
      allergies: String(data.get("allergies") || "").trim(),
      message: String(data.get("message") || "").trim(),
    };
  }

  function validate(payload, form) {
    if (!payload.nom) return "Indiquez votre nom.";
    if (!payload.participation) return "Indiquez votre participation.";

    if (isComing(payload.participation)) {
      if (!payload.enfants) return "Indiquez si vous venez avec ou sans enfants.";
      if (payload.enfants === "oui") {
        var n = Number(payload.nb_enfants);
        if (!n || n < 1) return "Indiquez le nombre d’enfants.";
      }
      if (!payload.plus_un) return "Indiquez si vous venez avec un +1.";
      if (payload.plus_un === "oui" && !payload.plus_un_nom) {
        return "Indiquez le nom de votre +1.";
      }
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

  function clearGuestDetails(form) {
    form.querySelectorAll('input[name="enfants"]').forEach(function (input) {
      input.checked = false;
    });
    form.querySelectorAll('input[name="plus_un"]').forEach(function (input) {
      input.checked = false;
    });
    var nb = form.querySelector('input[name="nb_enfants"]');
    var plusNom = form.querySelector('input[name="plus_un_nom"]');
    if (nb) {
      nb.value = "";
      nb.required = false;
    }
    if (plusNom) {
      plusNom.value = "";
      plusNom.required = false;
    }
  }

  function toggleAttendanceFields(form) {
    var selected = form.querySelector('input[name="participation"]:checked');
    var participation = selected ? selected.value : "";
    var evenement = form.getAttribute("data-evenement") || "";
    var coming = isComing(participation);

    form.querySelectorAll("[data-if-coming]").forEach(function (el) {
      el.hidden = !coming;
    });

    if (!coming) clearGuestDetails(form);

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

    if (coming) {
      toggleChildren(form);
      togglePlusUn(form);
    } else {
      var childrenFields = form.querySelector(".children-fields");
      var plus1Fields = form.querySelector(".plus1-fields");
      if (childrenFields) childrenFields.hidden = true;
      if (plus1Fields) plus1Fields.hidden = true;
    }
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

    if (payload.plus_un) {
      rows.splice(1, 0, {
        label: "+1",
        value:
          payload.plus_un === "oui"
            ? payload.plus_un_nom
            : "Sans accompagnant",
      });
    }

    if (payload.brunch) {
      rows.push({
        label: "Brunch du dimanche 18",
        value: payload.brunch === "oui" ? "Oui" : "Non",
      });
    }

    if (payload.enfants) {
      rows.push({
        label: "Enfants",
        value:
          payload.enfants === "oui"
            ? "Avec enfants (" + payload.nb_enfants + ")"
            : "Sans enfants",
      });
    }

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
      '<div class="form__recap-stamp" aria-hidden="true">' +
      '<span class="form__recap-stamp-inner">' +
      "<strong>Pret a envoyer</strong>" +
      "<em>Sandy &amp; Flav</em>" +
      "</span></div>" +
      "<h3></h3>" +
      '<p class="form__recap-lead"></p>' +
      '<ul class="form__recap-list"></ul>' +
      '<div class="form__recap-actions">' +
      '<button type="button" class="btn btn--outline form__recap-edit">Modifier</button>' +
      '<button type="button" class="btn form__recap-confirm"></button>' +
      "</div>";

    form.appendChild(recap);
    recap.querySelector("h3").textContent = "Récapitulatif de vos réponses";
    recap.querySelector(".form__recap-lead").textContent =
      "Vérifiez les informations ci-dessous avant l’envoi définitif.";
    recap.querySelector(".form__recap-confirm").textContent = "Confirmer l’envoi";
    recap.querySelector(".form__recap-stamp strong").textContent =
      "Prêt à envoyer";
    recap.querySelector(".form__recap-stamp em").textContent = "Sandy & Flav";

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
        child.classList.contains("form__success") ||
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
        child.classList.contains("form__success") ||
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

  function getOrCreateSuccess(form) {
    var success = form.querySelector(".form__success");
    if (success) return success;

    success = document.createElement("div");
    success.className = "form__success";
    success.hidden = true;
    success.innerHTML =
      '<div class="form__success-glow" aria-hidden="true"></div>' +
      '<div class="form__success-stamp" aria-hidden="true">' +
      '<span class="form__success-stamp-inner">' +
      "<strong></strong><em></em>" +
      "</span></div>" +
      '<p class="form__success-eyebrow"></p>' +
      "<h3></h3>" +
      '<p class="form__success-text"></p>' +
      '<div class="form__success-ornament" aria-hidden="true">' +
      "<span></span><span></span><span></span>" +
      "</div>" +
      '<div class="form__success-actions">' +
      '<a class="btn" href="index.html">Retour a l accueil</a>' +
      '<a class="btn btn--outline" href="infos.html">Infos pratiques</a>' +
      "</div>";

    form.appendChild(success);
    success.querySelector(".form__success-stamp strong").textContent = "Bien reçu";
    success.querySelector(".form__success-stamp em").textContent = "Sandy & Flav";
    success.querySelector(".form__success-eyebrow").textContent = "Confirmation";
    success.querySelector("h3").textContent = "Merci";
    success.querySelector(".form__success-text").textContent =
      "Votre réponse a bien été envoyée. On a hâte de célébrer avec vous.";
    success.querySelector('a[href="index.html"]').textContent = "Retour à l’accueil";
    return success;
  }

  function showSuccess(form, payload) {
    var recap = form.querySelector(".form__recap");
    if (recap) recap.hidden = true;

    var success = getOrCreateSuccess(form);
    var firstName = (payload.nom || "").trim().split(/\s+/)[0];
    var text = success.querySelector(".form__success-text");
    if (firstName) {
      text.textContent =
        "Merci " +
        firstName +
        " — votre réponse a bien été envoyée. On a hâte de célébrer avec vous.";
    }

    Array.prototype.forEach.call(form.children, function (child) {
      if (child === success) return;
      child.hidden = true;
    });
    success.hidden = false;
    setStatus(form, "", null);

    var section = form.closest("section");
    if (section) {
      var eyebrow = section.querySelector(".section__eyebrow");
      var title = section.querySelector(".section__title");
      var lead = section.querySelector(".section__lead");
      if (eyebrow) eyebrow.hidden = true;
      if (title) title.hidden = true;
      if (lead) lead.hidden = true;
    }

    success.scrollIntoView({ behavior: "smooth", block: "start" });
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
      form._rsvpPayload = null;
      showSuccess(form, payload);
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
    form.querySelectorAll('input[name="plus_un"]').forEach(function (input) {
      input.addEventListener("change", function () {
        togglePlusUn(form);
      });
    });
    form.querySelectorAll('input[name="participation"]').forEach(function (input) {
      input.addEventListener("change", function () {
        toggleAttendanceFields(form);
      });
    });
    toggleAttendanceFields(form);
    togglePlusUn(form);

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
