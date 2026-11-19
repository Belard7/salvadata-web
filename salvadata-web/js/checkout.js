// SalvaData – Página de pago (checkout)
// Demostración académica: no envía datos a ningún servidor ni procesa pagos reales.

(function () {
  'use strict';

  var PRICE = 20;
  var TRIAL_DAYS = 14;

  var BRANDS = {
    visa:       { name: 'Visa',             icon: 'fa-cc-visa',        length: 16, cvc: 3, groups: [4, 4, 4, 4] },
    mastercard: { name: 'Mastercard',       icon: 'fa-cc-mastercard',  length: 16, cvc: 3, groups: [4, 4, 4, 4] },
    amex:       { name: 'American Express', icon: 'fa-cc-amex',        length: 15, cvc: 4, groups: [4, 6, 5] },
    diners:     { name: 'Diners Club',      icon: 'fa-cc-diners-club', length: 14, cvc: 3, groups: [4, 6, 4] },
    discover:   { name: 'Discover',         icon: 'fa-cc-discover',    length: 16, cvc: 3, groups: [4, 4, 4, 4] }
  };

  var state = { plan: 'mensual', method: 'tarjeta' };
  var iconsLoaded = true;

  // Si la hoja de Font Awesome no cargó (sin internet), se muestran los nombres de las marcas.
  function applyIcons(ok) {
    iconsLoaded = ok;
    document.body.classList.toggle('no-fa', !ok);
    if (els.number.value) onNumberInput();
  }

  function checkIcons() {
    var probe = document.querySelector('.card-logo i');
    var cssOk = !!probe && /Font Awesome/.test(window.getComputedStyle(probe).fontFamily);
    if (!cssOk || !document.fonts || !document.fonts.load) { applyIcons(cssOk); return; }
    document.fonts.load('400 16px "Font Awesome 6 Brands"', '').then(
      function (faces) { applyIcons(faces.length > 0); },
      function () { applyIcons(false); }
    );
  }

  // ---------- Atajos al DOM ----------
  var $ = function (sel) { return document.querySelector(sel); };
  var form = $('#checkout-form');
  var els = {
    planRadios: document.querySelectorAll('input[name="plan"]'),
    payBlock: $('#pago-block'),
    trialNote: $('#trial-note'),
    tabs: document.querySelectorAll('.pay-tab'),
    panelCard: $('#panel-tarjeta'),
    panelPaypal: $('#panel-paypal'),
    logos: $('#card-logos'),
    number: $('#card-number'),
    exp: $('#card-exp'),
    cvc: $('#card-cvc'),
    holder: $('#card-name'),
    brandIcon: $('#card-brand-icon'),
    brandText: $('#card-brand-text'),
    cvcHint: $('#cvc-hint'),
    nombre: $('#nombre'),
    correo: $('#correo'),
    negocio: $('#negocio'),
    error: $('#form-error'),
    payBtn: $('#pay-btn'),
    payLabel: $('#pay-label'),
    preview: $('#card-preview'),
    previewBrand: $('#preview-brand'),
    previewNumber: $('#preview-number'),
    previewName: $('#preview-name'),
    previewExp: $('#preview-exp'),
    summaryPlan: $('#summary-plan'),
    trialRow: $('#trial-row'),
    total: $('#total-today'),
    nextCharge: $('#next-charge'),
    success: $('#success')
  };

  // ---------- Utilidades ----------
  function digits(value) { return String(value || '').replace(/\D/g, ''); }

  function money(n) { return '$' + n.toFixed(2); }

  function formatDate(date) {
    try {
      return new Intl.DateTimeFormat('es-SV', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
    } catch (e) {
      return date.toLocaleDateString();
    }
  }

  function detectBrand(d) {
    if (/^4/.test(d)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(d)) return 'mastercard';
    if (/^3[47]/.test(d)) return 'amex';
    if (/^3(0[0-5]|[689])/.test(d)) return 'diners';
    if (/^(6011|65|64[4-9])/.test(d)) return 'discover';
    return '';
  }

  // Algoritmo de Luhn: verifica que el número de tarjeta sea válido.
  function luhn(d) {
    var sum = 0, alt = false;
    for (var i = d.length - 1; i >= 0; i--) {
      var n = parseInt(d.charAt(i), 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  }

  function groupDigits(d, groups) {
    var out = [], pos = 0;
    for (var i = 0; i < groups.length && pos < d.length; i++) {
      out.push(d.slice(pos, pos + groups[i]));
      pos += groups[i];
    }
    return out.join(' ');
  }

  // Reescribe el valor del campo manteniendo el cursor en el lugar correcto.
  function rewrite(input, formatted) {
    var focused = document.activeElement === input;
    var caret = input.selectionStart || 0;
    var digitsBefore = digits(input.value.slice(0, caret)).length;
    input.value = formatted;
    if (!focused) return;
    var i = 0, count = 0;
    while (i < formatted.length && count < digitsBefore) {
      if (/\d/.test(formatted.charAt(i))) count++;
      i++;
    }
    input.setSelectionRange(i, i);
  }

  // ---------- Tarjeta: formato, marca y vista previa ----------
  function currentBrand() { return detectBrand(digits(els.number.value)); }

  function onNumberInput() {
    var d = digits(els.number.value);
    var brand = detectBrand(d);
    var info = BRANDS[brand];
    d = d.slice(0, info ? info.length : 16);
    rewrite(els.number, groupDigits(d, info ? info.groups : [4, 4, 4, 4]));

    // Resalta el logotipo de la marca detectada
    els.logos.classList.toggle('has-match', !!brand);
    els.logos.querySelectorAll('.card-logo').forEach(function (logo) {
      logo.classList.toggle('is-match', logo.getAttribute('data-brand') === brand);
    });

    els.brandIcon.innerHTML = '<i class="' + (info ? 'fa-brands ' + info.icon : 'fa-regular fa-credit-card') + '"></i>';
    els.brandText.textContent = info ? 'Tarjeta ' + info.name + ' detectada' : '';
    els.cvcHint.textContent = brand === 'amex' ? '4 dígitos al frente de la tarjeta' : '3 dígitos al reverso de la tarjeta';
    els.cvc.placeholder = brand === 'amex' ? '1234' : '123';

    els.previewBrand.innerHTML = info
      ? (iconsLoaded ? '<i class="fa-brands ' + info.icon + '" aria-hidden="true"></i>' : '<span>' + info.name + '</span>')
      : '<span>Tarjeta</span>';
    els.previewNumber.textContent = els.number.value ||
      (brand === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••');
    clearInvalid(els.number);
  }

  function onExpInput() {
    var d = digits(els.exp.value).slice(0, 4);
    if (d.length === 1 && parseInt(d, 10) > 1) d = '0' + d; // "4" → "04"
    var formatted = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    rewrite(els.exp, formatted);
    els.previewExp.textContent = formatted || 'MM/AA';
    clearInvalid(els.exp);
  }

  function onCvcInput() {
    var max = currentBrand() === 'amex' ? 4 : 3;
    els.cvc.value = digits(els.cvc.value).slice(0, max);
    clearInvalid(els.cvc);
  }

  function onHolderInput() {
    var v = els.holder.value.slice(0, 40);
    els.holder.value = v;
    els.previewName.textContent = v.trim() ? v.toUpperCase() : 'NOMBRE DEL TITULAR';
    clearInvalid(els.holder);
  }

  // ---------- Plan y método de pago ----------
  function setMethod(method) {
    state.method = method;
    els.tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-method') === method;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    els.panelCard.hidden = method !== 'tarjeta';
    els.panelPaypal.hidden = method !== 'paypal';
    hideError();
    render();
  }

  function render() {
    var trial = state.plan === 'prueba';
    var today = new Date();

    els.payBlock.hidden = trial;
    els.trialNote.hidden = !trial;
    els.preview.hidden = trial || state.method !== 'tarjeta';

    els.summaryPlan.textContent = trial ? 'Prueba gratis de ' + TRIAL_DAYS + ' días' : 'Suscripción mensual';
    els.trialRow.hidden = !trial;
    els.total.textContent = trial ? money(0) : money(PRICE);

    if (trial) {
      var end = new Date(today.getTime() + TRIAL_DAYS * 86400000);
      els.nextCharge.textContent = 'Si decides continuar, pagarás ' + money(PRICE) + ' al mes a partir del ' + formatDate(end) + '. Sin cobros automáticos.';
      els.payLabel.textContent = 'Comenzar prueba gratis';
    } else {
      var next = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
      els.nextCharge.textContent = 'Próximo cobro: ' + money(PRICE) + ' el ' + formatDate(next) + '. Cancela cuando quieras.';
      els.payLabel.textContent = state.method === 'paypal' ? 'Continuar con PayPal' : 'Pagar ' + money(PRICE) + ' de forma segura';
    }
  }

  // ---------- Validación ----------
  function markInvalid(input) { input.classList.add('is-invalid'); input.setAttribute('aria-invalid', 'true'); }
  function clearInvalid(input) { input.classList.remove('is-invalid'); input.removeAttribute('aria-invalid'); }
  function showError(msg) { els.error.textContent = msg; els.error.hidden = false; }
  function hideError() { els.error.hidden = true; els.error.textContent = ''; }

  function validate() {
    var errors = [];
    function fail(input, msg) { markInvalid(input); errors.push({ input: input, msg: msg }); }

    if (!els.nombre.value.trim()) fail(els.nombre, 'Escribe tu nombre completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(els.correo.value.trim())) fail(els.correo, 'Escribe un correo electrónico válido.');
    if (!els.negocio.value.trim()) fail(els.negocio, 'Escribe el nombre de tu negocio.');

    if (state.plan === 'mensual' && state.method === 'tarjeta') {
      var d = digits(els.number.value);
      var brand = detectBrand(d);
      if (!d) fail(els.number, 'Ingresa el número de tu tarjeta.');
      else if (!brand) fail(els.number, 'No reconocemos esta tarjeta. Aceptamos Visa, Mastercard, American Express, Diners Club y Discover.');
      else if (d.length < BRANDS[brand].length || !luhn(d)) fail(els.number, 'El número de tarjeta no es válido. Revísalo.');

      var e = digits(els.exp.value);
      var mm = parseInt(e.slice(0, 2), 10), yy = parseInt(e.slice(2, 4), 10);
      var now = new Date(), cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
      if (e.length < 4 || !(mm >= 1 && mm <= 12)) fail(els.exp, 'Ingresa una fecha de vencimiento válida (MM/AA).');
      else if (yy < cy || (yy === cy && mm < cm)) fail(els.exp, 'Esta tarjeta está vencida.');

      var need = brand === 'amex' ? 4 : 3;
      if (els.cvc.value.length !== need) fail(els.cvc, 'El código de seguridad debe tener ' + need + ' dígitos.');

      if (els.holder.value.trim().length < 3) fail(els.holder, 'Escribe el nombre tal como aparece en la tarjeta.');
    }
    return errors;
  }

  // ---------- Envío (simulado) ----------
  function onSubmit(ev) {
    ev.preventDefault();
    hideError();
    form.querySelectorAll('.is-invalid').forEach(clearInvalid);

    var errors = validate();
    if (errors.length) {
      showError(errors.length === 1 ? errors[0].msg : errors[0].msg + ' (y ' + (errors.length - 1) + ' campo(s) más por revisar)');
      errors[0].input.focus();
      return;
    }

    var trial = state.plan === 'prueba';
    els.payBtn.disabled = true;
    els.payLabel.textContent = trial ? 'Creando tu cuenta…' : 'Procesando pago…';

    setTimeout(function () { showSuccess(trial); }, 1400);
  }

  function showSuccess(trial) {
    var email = els.correo.value.trim();
    var title = trial ? '¡Tu prueba gratis comenzó!' : (state.method === 'paypal' ? '¡Pago con PayPal confirmado!' : '¡Pago aprobado!');
    $('#success-title').textContent = title;
    $('#success-text').textContent = trial
      ? 'Tienes ' + TRIAL_DAYS + ' días para proteger tu negocio sin costo. Enviamos las instrucciones a ' + email + '.'
      : 'Tu suscripción al Plan Negocio está activa. Enviamos el comprobante y los pasos para instalar el agente a ' + email + '.';

    var paid = '';
    if (!trial && state.method === 'tarjeta') {
      var d = digits(els.number.value);
      paid = 'Pagado con ' + BRANDS[detectBrand(d)].name + ' terminada en ' + d.slice(-4) + ' · Total: ' + money(PRICE);
    } else if (!trial) {
      paid = 'Pagado con PayPal · Total: ' + money(PRICE);
    }
    $('#success-paid').textContent = paid;

    form.hidden = true;
    els.preview.hidden = true;
    els.success.hidden = false;
    els.success.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- Eventos ----------
  els.planRadios.forEach(function (radio) {
    radio.addEventListener('change', function () { state.plan = radio.value; hideError(); render(); });
  });

  els.tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { setMethod(tab.getAttribute('data-method')); });
    // Navegación con flechas entre pestañas (accesibilidad)
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = state.method === 'tarjeta' ? 'paypal' : 'tarjeta';
      setMethod(next);
      document.querySelector('.pay-tab[data-method="' + next + '"]').focus();
    });
  });

  els.number.addEventListener('input', onNumberInput);
  els.exp.addEventListener('input', onExpInput);
  els.cvc.addEventListener('input', onCvcInput);
  els.holder.addEventListener('input', onHolderInput);
  [els.nombre, els.correo, els.negocio].forEach(function (input) {
    input.addEventListener('input', function () { clearInvalid(input); });
  });

  form.addEventListener('submit', onSubmit);

  $('#reset-btn').addEventListener('click', function () { window.location.reload(); });
  $('#download-btn').addEventListener('click', function () {
    this.textContent = 'Disponible al lanzar SalvaData';
    this.disabled = true;
  });

  // ---------- Inicio: plan elegido desde la landing (?plan=prueba | ?plan=mensual) ----------
  var params = new URLSearchParams(window.location.search);
  if (params.get('plan') === 'prueba') {
    state.plan = 'prueba';
    document.querySelector('input[name="plan"][value="prueba"]').checked = true;
  }
  render();

  window.addEventListener('load', checkIcons);
})();
