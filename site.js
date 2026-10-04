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

/* ---- Motion, "Reveal" (chosen 4 Oct 2026) -------------------------------
   Only runs when the head script set html.motion, which it does only for
   visitors who have not asked for reduced motion. The styles live at the end
   of style.css. If anything here fails, motion is switched off and the page
   is the static site. */
(function () {
  'use strict';

  var root = document.documentElement;

  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function nextFrame(fn) {
    window.requestAnimationFrame(function () { window.requestAnimationFrame(fn); });
  }

  // The longest any headline waits before its last word starts to rise.
  var MAX_STAGGER = 900;

  // Wrap every word in two spans so it can rise out of its own mask. Inline
  // elements such as <em> are kept, so the italic accent survives. Returns
  // when the last word has landed, in ms.
  function split(el, step) {
    var count = el.textContent.trim().split(/\s+/).length;
    step = Math.min(step, Math.floor(MAX_STAGGER / Math.max(1, count - 1)));
    var n = 0;
    (function walk(parent) {
      each(Array.prototype.slice.call(parent.childNodes), function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var w = document.createElement('span');
            var wi = document.createElement('span');
            w.className = 'w';
            wi.className = 'wi';
            wi.style.setProperty('--d', (n++ * step) + 'ms');
            wi.textContent = part;
            w.appendChild(wi);
            frag.appendChild(w);
          });
          parent.replaceChild(frag, node);
        } else if (node.nodeType === 1) {
          walk(node);
        }
      });
    })(el);
    var last = Math.max(0, n - 1) * step;
    el.style.setProperty('--ul', (last + 700) + 'ms');
    el.classList.add('split');
    return last + 1150;
  }

  // Once the words have landed, drop the masks so nothing is ever clipped.
  function settleLater(el, ms) {
    window.setTimeout(function () { el.classList.add('settled'); }, ms);
  }

  // Count a number up to its real value, holding its final width so nothing
  // around it moves.
  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!isFinite(target)) return;
    el.classList.add('counting');
    el.style.minWidth = el.getBoundingClientRect().width + 'px';
    // Screen readers get the true number; the counting digits are hidden from them.
    var spoken = document.createElement('span');
    spoken.className = 'sr';
    spoken.textContent = String(target);
    el.parentNode.insertBefore(spoken, el);
    el.setAttribute('aria-hidden', 'true');
    var start = null;
    var dur = 1600;
    var step = function (now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        el.textContent = String(Math.round(target * eased));
        window.requestAnimationFrame(step);
      } else {
        el.textContent = String(target);
        el.classList.remove('counting');
        el.style.minWidth = '';
        el.removeAttribute('aria-hidden');
        if (spoken.parentNode) spoken.parentNode.removeChild(spoken);
      }
    };
    el.textContent = '0';
    window.requestAnimationFrame(step);
  }

  function run() {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.classList.add('in');
        if (el.hasAttribute('data-settle')) settleLater(el, +el.getAttribute('data-settle'));
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });

    function words(el) {
      el.setAttribute('data-settle', split(el, 55) + 250);
      io.observe(el);
    }
    function reveal(el, i) {
      el.classList.add('rv');
      el.style.setProperty('--rv-d', (100 + Math.min(i, 4) * 110) + 'ms');
      io.observe(el);
    }

    // Containers whose children are revealed one by one, and lists whose
    // items are. Anything else is revealed as one piece.
    var GROUPS = '.narrow, .sec-grid, .sec-body, .prose, .coach-grid, .about-grid, .about-copy, .cols-2, .cols-2 > div';
    var LISTS = 'ol, ul, .cards, .faq';
    function walk(parent) {
      var i = 0;
      each(parent.children, function (el) {
        if (el.matches('h2')) { words(el); return; }
        if (el.matches('.portrait')) { io.observe(el); return; }
        if (el.matches(GROUPS)) {
          if (el.matches('.sec-grid')) io.observe(el);
          walk(el);
          return;
        }
        if (el.matches(LISTS)) {
          var j = 0;
          each(el.children, function (item) { reveal(item, j++); });
          return;
        }
        reveal(el, i++);
      });
    }

    // The opening of each page plays on load; everything else as it arrives.
    each(document.querySelectorAll('main > section'), function (sec) {
      if (sec.matches('.hero, .page-head, .cc-hero, .thanks')) {
        var h1 = sec.querySelector('h1');
        var landed = h1 ? split(h1, 85) : 0;
        if (!sec.matches('.hero')) {
          var k = 0;
          each(sec.querySelectorAll('.wrap > *, .head-copy > *'), function (el) {
            if (el.matches('h1, .eyebrow, .head-copy')) return;
            el.style.setProperty('--in-d', (Math.max(300, landed - 500) + k++ * 150) + 'ms');
          });
        }
        nextFrame(function () {
          sec.classList.add('in');
          if (h1) {
            h1.classList.add('in');
            settleLater(h1, landed + 250);
          }
        });
        return;
      }
      if (sec.matches('.block, .cc-sec.rule-top')) io.observe(sec);
      each(sec.children, function (child) { if (child.matches('.wrap')) walk(child); });
    });

    // Anything the CSS hides by structure alone (a portrait, a gold rule)
    // is always watched, wherever it sits, so it can never stay hidden.
    // Observing an element twice is harmless.
    each(document.querySelectorAll('.portrait, .sec-grid, .block, .cc-sec.rule-top'), function (el) { io.observe(el); });

    // Additions 1 and 2: numbers count up to their real value when they
    // arrive. The real value is always the last thing written.
    var counter = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        counter.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
    each(document.querySelectorAll('[data-count]'), function (el) { counter.observe(el); });

    // Additions 3 and 4: a gold line runs down through the numbered steps as
    // you scroll, and each number lights up as the line reaches it.
    var journeys = [];
    each(document.querySelectorAll('ol.arc, ol.steps'), function (ol) {
      if (ol.children.length < 2) return;
      ol.classList.add('journey');
      journeys.push(ol);
    });
    var measure = function () {
      journeys.forEach(function (ol) {
        var items = ol.children;
        var mid = function (li) {
          var c = window.getComputedStyle(li);
          return li.offsetTop + parseFloat(c.paddingTop) + 20;
        };
        var top = mid(items[0]);
        var bottom = mid(items[items.length - 1]);
        ol.style.setProperty('--l-top', top + 'px');
        ol.style.setProperty('--l-h', Math.max(0, bottom - top) + 'px');
        ol._line = { top: top, height: Math.max(1, bottom - top) };
      });
    };
    var follow = function () {
      var line = window.innerHeight * 0.62;
      journeys.forEach(function (ol) {
        if (!ol._line) return;
        var start = ol.getBoundingClientRect().top + ol._line.top;
        var p = Math.min(1, Math.max(0, (line - start) / ol._line.height));
        ol.style.setProperty('--p', p.toFixed(3));
        each(ol.children, function (li) {
          var y = li.getBoundingClientRect().top + parseFloat(window.getComputedStyle(li).paddingTop) + 20;
          li.classList.toggle('lit', y <= line);
        });
      });
    };
    if (journeys.length) {
      var jTicking = false;
      var onJourney = function () {
        if (jTicking) return;
        jTicking = true;
        window.requestAnimationFrame(function () { follow(); jTicking = false; });
      };
      measure();
      follow();
      window.addEventListener('scroll', onJourney, { passive: true });
      window.addEventListener('resize', function () { measure(); onJourney(); });
      // Fonts arriving late change the heights, so measure once more.
      window.addEventListener('load', function () { measure(); onJourney(); });
    }

    // The header lifts off the page once you scroll.
    var header = document.querySelector('.site-header');
    if (header) {
      var ticking = false;
      var onScroll = function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(function () {
          header.classList.toggle('scrolled', window.scrollY > 8);
          ticking = false;
        });
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  if (!root.classList.contains('motion')) return;
  try {
    run();
    window.ELV8_MOTION_READY = true;
  } catch (err) {
    root.classList.remove('motion');
  }
})();

/* ---- Addition 5: the films ----------------------------------------------
   Play and pause work for everyone. A film only starts by itself for visitors
   who have not asked for reduced motion, pauses when scrolled out of view to
   save the battery, and stays paused once someone presses pause. If a browser
   refuses to autoplay (low power mode), the still image and play button stay. */
(function () {
  'use strict';

  var motion = document.documentElement.classList.contains('motion');

  Array.prototype.forEach.call(document.querySelectorAll('[data-film]'), function (box) {
    var video = box.querySelector('video');
    var btn = box.querySelector('[data-film-toggle]');
    if (!video || !btn) return;

    var heldByViewer = !motion;

    var sync = function () {
      var playing = !video.paused;
      btn.classList.toggle('is-playing', playing);
      btn.setAttribute('aria-label', playing ? 'Pause the film' : 'Play the film');
    };
    var tryPlay = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () { sync(); });
    };

    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    btn.addEventListener('click', function () {
      if (video.paused) { heldByViewer = false; tryPlay(); }
      else { heldByViewer = true; video.pause(); }
    });
    sync();
    box.classList.add('film-ready');

    if (!motion) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var inView = entries[entries.length - 1].isIntersecting;
        if (inView && !heldByViewer) tryPlay();
        else if (!inView && !video.paused) video.pause();
      }, { threshold: 0.25 }).observe(box);
    } else {
      tryPlay();
    }
  });
})();
