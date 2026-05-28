/* RestoBook widget — standalone vanilla JS, no dependencies. */
(function () {
  "use strict"

  // Resolve the <script> element and the API base URL.
  var script = document.currentScript
  if (!script) {
    var scripts = document.getElementsByTagName("script")
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && /widget\.js(\?|$)/.test(scripts[i].src)) { script = scripts[i]; break }
    }
  }
  if (!script) return

  var slug = script.getAttribute("data-slug")
  var baseUrl
  try { baseUrl = new URL(script.src).origin } catch (e) { baseUrl = "" }

  // Create the host container right after the script tag.
  var root = document.createElement("div")
  root.className = "rb-root"
  script.parentNode.insertBefore(root, script.nextSibling)

  // Inject scoped styles once.
  if (!document.getElementById("rb-styles")) {
    var style = document.createElement("style")
    style.id = "rb-styles"
    style.textContent =
      ".rb-root{font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#111;max-width:480px;margin:0 auto;}" +
      ".rb-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;}" +
      ".rb-h{font-size:16px;font-weight:600;margin:0 0 4px;}" +
      ".rb-sub{font-size:13px;color:#6b7280;margin:0 0 16px;}" +
      ".rb-field{display:flex;flex-direction:column;gap:4px;margin-bottom:12px;}" +
      ".rb-label{font-size:13px;font-weight:500;color:#374151;}" +
      ".rb-input,.rb-textarea{width:100%;padding:8px 10px;font-size:14px;border:1px solid #d1d5db;border-radius:6px;outline:none;font-family:inherit;box-sizing:border-box;}" +
      ".rb-input:focus,.rb-textarea:focus{border-color:#111;box-shadow:0 0 0 1px #111;}" +
      ".rb-row{display:flex;gap:8px;margin-top:16px;}" +
      ".rb-btn{flex:1;padding:9px 14px;font-size:14px;font-weight:500;border-radius:6px;border:1px solid transparent;cursor:pointer;font-family:inherit;}" +
      ".rb-btn-primary{background:#E53E3E;color:#fff;}" +
      ".rb-btn-primary:hover{background:#C53030;}" +
      ".rb-btn-secondary{background:#fff;color:#111;border-color:#d1d5db;}" +
      ".rb-btn-secondary:hover{background:#f9fafb;}" +
      ".rb-btn:disabled{opacity:.5;cursor:not-allowed;}" +
      ".rb-slots{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}" +
      ".rb-slot{padding:8px;font-size:13px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-family:inherit;}" +
      ".rb-slot:hover:not(:disabled){border-color:#111;background:#111;color:#fff;}" +
      ".rb-slot:disabled{color:#d1d5db;cursor:not-allowed;background:#f9fafb;}" +
      ".rb-party{display:flex;flex-wrap:wrap;gap:6px;}" +
      ".rb-party button{width:36px;height:36px;border:1px solid #d1d5db;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;font-family:inherit;}" +
      ".rb-party button.rb-active{background:#111;color:#fff;border-color:#111;}" +
      ".rb-error{font-size:13px;color:#991b1b;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px 10px;margin-top:8px;}" +
      ".rb-success{text-align:center;}" +
      ".rb-success-icon{font-size:32px;margin-bottom:8px;}" +
      ".rb-honeypot{position:absolute;left:-10000px;width:0;height:0;overflow:hidden;}" +
      ".rb-stepper{display:flex;align-items:center;gap:8px;margin-bottom:16px;}" +
      ".rb-step{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:500;background:#e5e7eb;color:#6b7280;}" +
      ".rb-step.rb-step-active{background:#111;color:#fff;}" +
      ".rb-step.rb-step-done{background:#10b981;color:#fff;}" +
      ".rb-step-line{flex:0 0 24px;height:2px;background:#e5e7eb;}" +
      ".rb-step-line.rb-step-line-done{background:#10b981;}"
    document.head.appendChild(style)
  }

  if (!slug) {
    root.innerHTML = '<div class="rb-card"><p class="rb-error">Falta data-slug en el script.</p></div>'
    return
  }

  // State.
  var state = {
    step: 1,
    date: todayStr(),
    time: null,
    slots: null,
    slotsLoading: false,
    slotsError: null,
    partySize: 2,
    name: "",
    email: "",
    phone: "",
    notes: "",
    website: "",
    submitting: false,
    submitError: null,
    confirmation: null,
    maxPartySize: 10,
  }

  function todayStr() {
    var d = new Date()
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
  }
  function maxDateStr() {
    var d = new Date()
    d.setDate(d.getDate() + 60)
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate())
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n }

  function fetchWithTimeout(url, opts) {
    opts = opts || {}
    var ctrl = new AbortController()
    var timer = setTimeout(function () { ctrl.abort() }, 10000)
    opts.signal = ctrl.signal
    return fetch(url, opts).finally(function () { clearTimeout(timer) })
  }

  function loadSlots() {
    state.slotsLoading = true
    state.slotsError = null
    state.slots = null
    render()
    fetchWithTimeout(baseUrl + "/api/reservations/availability?slug=" + encodeURIComponent(slug) + "&date=" + encodeURIComponent(state.date))
      .then(function (r) { return r.json() })
      .then(function (data) {
        if (data && data.error) state.slotsError = data.error
        else state.slots = (data && data.slots) || []
      })
      .catch(function () { state.slotsError = "Error de conexión." })
      .finally(function () { state.slotsLoading = false; render() })
  }

  function submit() {
    state.submitting = true
    state.submitError = null
    render()
    fetchWithTimeout(baseUrl + "/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug,
        date: state.date,
        time: state.time,
        partySize: state.partySize,
        customerName: state.name.trim(),
        customerEmail: state.email.trim(),
        customerPhone: state.phone.trim() || undefined,
        notes: state.notes.trim() || undefined,
        website: state.website,
      }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d } }) })
      .then(function (res) {
        if (!res.ok) state.submitError = (res.data && res.data.error) || "No se pudo completar la reserva."
        else { state.confirmation = res.data; state.step = 4 }
      })
      .catch(function () { state.submitError = "Error de conexión." })
      .finally(function () { state.submitting = false; render() })
  }

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] }) }

  function render() {
    if (state.step === 4 && state.confirmation) {
      root.innerHTML =
        '<div class="rb-card rb-success">' +
        '<div class="rb-success-icon">✅</div>' +
        '<h2 class="rb-h">¡Reserva confirmada!</h2>' +
        '<p class="rb-sub">Te esperamos el <strong>' + esc(state.date) + '</strong> a las <strong>' + esc(state.confirmation.time) + '</strong> para <strong>' + state.confirmation.partySize + '</strong> ' + (state.confirmation.partySize === 1 ? "persona" : "personas") + ".</p>" +
        '<p style="font-size:12px;color:#9ca3af;">Código: ' + esc(state.confirmation.id) + "</p>" +
        "</div>"
      return
    }

    var html = '<div class="rb-card">'
    html += stepperHtml(state.step)

    if (state.step === 1) {
      html +=
        '<h2 class="rb-h">Elige fecha</h2>' +
        '<div class="rb-field"><input class="rb-input" type="date" id="rb-date" value="' + esc(state.date) + '" min="' + todayStr() + '" max="' + maxDateStr() + '"></div>' +
        '<div class="rb-row"><button class="rb-btn rb-btn-primary" id="rb-next">Continuar →</button></div>'
    } else if (state.step === 2) {
      html += '<h2 class="rb-h">Elige hora</h2><p class="rb-sub">' + esc(state.date) + "</p>"
      if (state.slotsLoading) html += '<p class="rb-sub">Cargando horarios…</p>'
      else if (state.slotsError) html += '<p class="rb-error">' + esc(state.slotsError) + "</p>"
      else if (state.slots && state.slots.length === 0) html += '<p class="rb-sub">No hay horarios disponibles esa fecha.</p>'
      else if (state.slots) {
        html += '<div class="rb-slots">'
        for (var i = 0; i < state.slots.length; i++) {
          var s = state.slots[i]
          html += '<button class="rb-slot" data-time="' + esc(s.time) + '"' + (s.available ? "" : " disabled") + ">" + esc(s.time) + "</button>"
        }
        html += "</div>"
      }
      html += '<div class="rb-row"><button class="rb-btn rb-btn-secondary" id="rb-back">← Atrás</button></div>'
    } else if (state.step === 3) {
      html +=
        '<h2 class="rb-h">Tus datos</h2>' +
        '<p class="rb-sub">' + esc(state.date) + " · " + esc(state.time) + " · " + state.partySize + " " + (state.partySize === 1 ? "persona" : "personas") + "</p>"

      html += '<div class="rb-field"><label class="rb-label">Comensales</label><div class="rb-party" id="rb-party">'
      for (var n = 1; n <= state.maxPartySize; n++) {
        html += '<button type="button" data-n="' + n + '" class="' + (state.partySize === n ? "rb-active" : "") + '">' + n + "</button>"
      }
      html += "</div></div>"

      html +=
        '<div class="rb-field"><label class="rb-label">Nombre</label><input class="rb-input" id="rb-name" value="' + esc(state.name) + '" required></div>' +
        '<div class="rb-field"><label class="rb-label">Email</label><input class="rb-input" id="rb-email" type="email" value="' + esc(state.email) + '" required></div>' +
        '<div class="rb-field"><label class="rb-label">Teléfono (opcional)</label><input class="rb-input" id="rb-phone" type="tel" value="' + esc(state.phone) + '"></div>' +
        '<div class="rb-field"><label class="rb-label">Notas (opcional)</label><textarea class="rb-textarea" id="rb-notes" rows="2">' + esc(state.notes) + "</textarea></div>"

      // Honeypot
      html += '<div class="rb-honeypot" aria-hidden="true"><label>Website<input id="rb-website" type="text" tabindex="-1" autocomplete="off"></label></div>'

      if (state.submitError) html += '<p class="rb-error">' + esc(state.submitError) + "</p>"

      html +=
        '<div class="rb-row">' +
        '<button class="rb-btn rb-btn-secondary" id="rb-back">← Atrás</button>' +
        '<button class="rb-btn rb-btn-primary" id="rb-submit"' + (state.submitting ? " disabled" : "") + ">" + (state.submitting ? "Enviando…" : "Confirmar reserva") + "</button>" +
        "</div>"
    }

    html += "</div>"
    root.innerHTML = html
    attachHandlers()
  }

  function stepperHtml(step) {
    var html = '<div class="rb-stepper">'
    for (var s = 1; s <= 3; s++) {
      var cls = "rb-step" + (s === step ? " rb-step-active" : "") + (s < step ? " rb-step-done" : "")
      html += '<div class="' + cls + '">' + (s < step ? "✓" : s) + "</div>"
      if (s < 3) html += '<div class="rb-step-line' + (s < step ? " rb-step-line-done" : "") + '"></div>'
    }
    html += "</div>"
    return html
  }

  function attachHandlers() {
    var dateInput = root.querySelector("#rb-date")
    if (dateInput) dateInput.addEventListener("change", function (e) { state.date = e.target.value })

    var next = root.querySelector("#rb-next")
    if (next) next.addEventListener("click", function () {
      if (!state.date) return
      state.step = 2
      loadSlots()
    })

    var back = root.querySelector("#rb-back")
    if (back) back.addEventListener("click", function () {
      state.step = Math.max(1, state.step - 1)
      state.submitError = null
      render()
    })

    root.querySelectorAll(".rb-slot[data-time]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.time = btn.getAttribute("data-time")
        state.step = 3
        render()
      })
    })

    root.querySelectorAll("#rb-party button[data-n]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        state.partySize = parseInt(btn.getAttribute("data-n"), 10)
        render()
      })
    })

    var bindInput = function (id, key) {
      var el = root.querySelector("#" + id)
      if (el) el.addEventListener("input", function (e) { state[key] = e.target.value })
    }
    bindInput("rb-name", "name")
    bindInput("rb-email", "email")
    bindInput("rb-phone", "phone")
    bindInput("rb-notes", "notes")
    bindInput("rb-website", "website")

    var submitBtn = root.querySelector("#rb-submit")
    if (submitBtn) submitBtn.addEventListener("click", function () {
      if (!state.name.trim() || !state.email.trim()) {
        state.submitError = "Nombre y email son obligatorios."
        render()
        return
      }
      submit()
    })
  }

  render()
})()
