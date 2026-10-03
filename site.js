/* ELV8 site settings. These two lines are the only thing you edit.

   BOOKING_URL  Shea's Google booking page. While it is empty, every
                "Book a 20-minute call" button goes to /contact.html.
                Once it is set, they all go to it, in the same tab.
   COHORT_START The founding cohort start date, written the way it should
                read, for example '6 November 2026'. While it is empty the
                page says "Starts once six coaches are in".
*/
const BOOKING_URL = '';
const COHORT_START = '';

(function () {
  'use strict';

  var doc = document;
  doc.documentElement.classList.add('js');

  function ready(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  ready(function () {

    /* ---- Booking links ------------------------------------------------- */
    var booking = (typeof BOOKING_URL === 'string') ? BOOKING_URL.trim() : '';
    each(doc.querySelectorAll('[data-booking]'), function (a) {
      a.setAttribute('href', booking || '/contact.html');
      a.removeAttribute('target');
      a.removeAttribute('rel');
    });
    // Some places (the contact page) only show the booking button once a
    // real booking page exists, so it never points at the page it sits on.
    each(doc.querySelectorAll('[data-booking-only]'), function (el) {
      el.hidden = !booking;
    });

    /* ---- Cohort start -------------------------------------------------- */
    var start = (typeof COHORT_START === 'string') ? COHORT_START.trim() : '';
    var startText = start ? 'Starts ' + start : 'Starts once six coaches are in';
    each(doc.querySelectorAll('[data-cohort-start]'), function (el) {
      el.textContent = startText;
    });

    /* ---- Mobile navigation --------------------------------------------- */
    var toggle = doc.querySelector('[data-nav-toggle]');
    var nav = doc.querySelector('[data-nav]');
    if (toggle && nav) {
      var setOpen = function (open) {
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        nav.classList.toggle('is-open', open);
        doc.documentElement.classList.toggle('nav-open', open);
      };
      toggle.addEventListener('click', function () {
        setOpen(toggle.getAttribute('aria-expanded') !== 'true');
      });
      doc.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
          setOpen(false);
          toggle.focus();
        }
      });
      nav.addEventListener('click', function (e) {
        if (e.target.closest && e.target.closest('a')) setOpen(false);
      });
      if (window.matchMedia) {
        var mq = window.matchMedia('(min-width: 1040px)');
        var onChange = function () { if (mq.matches) setOpen(false); };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
    }

    /* ---- Pre-select the contact topic from the link (?interest=Speaking) */
    var interest = doc.querySelector('select[name="interest"]');
    if (interest) {
      try {
        var want = new URLSearchParams(window.location.search).get('interest');
        if (want) {
          each(interest.options, function (opt) {
            if (opt.value.toLowerCase() === want.toLowerCase()) interest.value = opt.value;
          });
        }
      } catch (err) { /* a missing preselect is fine */ }
    }

    /* ---- Forms: inline messages, one submit only ----------------------- */
    function fieldOf(el) { return el.closest ? el.closest('.field') : null; }

    function setError(el, on) {
      var field = fieldOf(el);
      if (!field) return;
      field.classList.toggle('err', on);
      el.setAttribute('aria-invalid', on ? 'true' : 'false');
      var msg = field.querySelector('.msg');
      if (msg) msg.textContent = on ? (el.getAttribute('data-msg') || el.validationMessage || '') : '';
    }

    each(doc.querySelectorAll('form[data-form]'), function (form) {
      // Native checks stay on if this script never loads.
      form.noValidate = true;
      var status = form.querySelector('[data-form-status]');
      var button = form.querySelector('[type="submit"]');

      form.addEventListener('submit', function (e) {
        var bad = [];
        each(form.elements, function (el) {
          if (!el.willValidate || el.name === 'bot-field' || el.type === 'hidden') return;
          if (el.checkValidity()) setError(el, false);
          else { setError(el, true); bad.push(el); }
        });
        if (bad.length) {
          e.preventDefault();
          if (status) status.textContent = 'Check the highlighted fields and go again.';
          bad[0].focus();
          return;
        }
        if (status) status.textContent = '';
        if (button) {
          button.setAttribute('data-label', button.textContent);
          window.setTimeout(function () {
            button.disabled = true;
            button.textContent = 'Sending';
          }, 0);
        }
      });

      form.addEventListener('input', function (e) {
        if (e.target && e.target.name && fieldOf(e.target) && fieldOf(e.target).classList.contains('err')) {
          setError(e.target, false);
        }
      });

      // Back button after a send: put the button back.
      window.addEventListener('pageshow', function (e) {
        if (e.persisted && button && button.hasAttribute('data-label')) {
          button.disabled = false;
          button.textContent = button.getAttribute('data-label');
        }
      });
    });
  });
})();
