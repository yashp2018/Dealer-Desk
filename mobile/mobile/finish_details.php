<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M4 — Finish Details.
 *
 * The replacement for the fifteen-minute form. One question per card,
 * generated entirely from tbldd_type_fields. Each answer saves the moment it
 * is given, so abandoning halfway loses nothing.
 */
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m" id="dd-details" data-request="<?php echo (int) $request->id; ?>">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m_request/' . $request->id); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <div>
          <div class="d" style="font-size:15px"><?php echo html_escape($request->dealer_name); ?></div>
          <div class="dd-eyebrow"><?php echo html_escape($request->type_name); ?></div>
        </div>
      </div>

      <?php if (!$cards) { ?>
        <div class="dd-empty">
          <p><?php echo _l('dd_none'); ?></p>
          <a href="<?php echo admin_url('dealer_desk/m_request/' . $request->id); ?>" class="dd-btn grey sm">
            <?php echo _l('dd_back'); ?>
          </a>
        </div>
      <?php } else { ?>

        <div class="dd-dots" id="dd-dots">
          <?php foreach ($cards as $i => $card) { ?>
            <span class="<?php echo $i === 0 ? 'on' : ''; ?><?php echo $card['value'] ? ' done' : ''; ?>"></span>
          <?php } ?>
        </div>

        <?php foreach ($cards as $i => $card) {
            $field   = $card['field'];
            $value   = $card['value'];
            $current = '';

            if ($value) {
                if ($field->input_type === 'item_ref') {
                    $current = $value->value_ref;
                } elseif (in_array($field->input_type, ['number', 'money', 'toggle'], true)) {
                    $current = $value->value_num;
                } elseif ($field->input_type === 'date') {
                    $current = $value->value_date;
                } else {
                    $current = $value->value_text;
                }
            }
        ?>
          <?php $catalogue = in_array($field->options_source, ['items', 'items_group'], true); ?>
          <div class="dd-q <?php echo $i === 0 ? 'active' : ''; ?>"
               data-index="<?php echo $i; ?>"
               data-key="<?php echo html_escape($field->field_key); ?>"
               data-input="<?php echo html_escape($field->input_type); ?>"
               data-source="<?php echo html_escape($field->options_source); ?>"
               data-required="<?php echo (int) $field->is_required; ?>">

            <div class="qh"><?php echo html_escape($field->label); ?></div>
            <?php if ($field->help_text) { ?>
              <div class="qhelp"><?php echo html_escape($field->help_text); ?></div>
            <?php } ?>

            <?php if (in_array($field->input_type, ['select', 'item_ref'], true)) { ?>
              <?php /* A catalogue field always gets the box: the card holds
                       only the opening page, so search is the only way to
                       reach the rest of it however short the list looks. */ ?>
              <?php if ($catalogue || count($card['options']) > 8) { ?>
                <input type="text" class="dd-search dd-opt-filter" placeholder="<?php echo _l('dd_search'); ?>">
              <?php } ?>
              <div class="dd-opts">
                <?php foreach ($card['options'] as $option) { ?>
                  <div class="dd-opt <?php echo ((string) $current === (string) $option['value']) ? 'sel' : ''; ?>"
                       data-value="<?php echo html_escape($option['value']); ?>"
                       data-label="<?php echo html_escape(strtolower($option['label'])); ?>">
                    <?php echo html_escape($option['label']); ?>
                  </div>
                <?php } ?>
              </div>

            <?php } elseif (in_array($field->input_type, ['number'], true)) { ?>
              <div class="dd-stepper">
                <button type="button" data-delta="-1">&minus;</button>
                <span class="v" data-value="<?php echo $current !== '' ? (int) $current : 1; ?>">
                  <?php echo $current !== '' ? (int) $current : 1; ?>
                </span>
                <button type="button" data-delta="1">+</button>
              </div>

            <?php } elseif ($field->input_type === 'money') { ?>
              <input type="number" step="0.01" inputmode="decimal" class="dd-input dd-val"
                     value="<?php echo html_escape($current); ?>">

            <?php } elseif ($field->input_type === 'date') { ?>
              <input type="date" class="dd-input dd-val" value="<?php echo html_escape($current); ?>">

            <?php } elseif ($field->input_type === 'textarea') { ?>
              <textarea class="dd-input dd-val" rows="4"><?php echo html_escape($current); ?></textarea>

            <?php } elseif ($field->input_type === 'toggle') { ?>
              <div class="dd-choice">
                <button type="button" class="dd-tog <?php echo $current ? 'sel' : ''; ?>" data-value="1">Yes</button>
                <button type="button" class="dd-tog <?php echo ($current !== '' && !$current) ? 'sel' : ''; ?>" data-value="0">No</button>
              </div>

            <?php } elseif ($field->input_type === 'photo') { ?>
              <input type="file" accept="image/*" capture="environment" class="dd-input dd-photo">
              <p class="dd-muted" style="margin-top:8px;font-size:13px">
                <?php echo $current ? html_escape($current) : ''; ?>
              </p>

            <?php } else { ?>
              <input type="text" class="dd-input dd-val" value="<?php echo html_escape($current); ?>">
            <?php } ?>
          </div>
        <?php } ?>

      <?php } ?>
    </div>

    <?php if ($cards) { ?>
    <div class="dd-sticky-foot">
      <button type="button" class="dd-btn grey" id="dd-prev" style="flex:0 0 90px"><?php echo _l('dd_back'); ?></button>
      <button type="button" class="dd-btn grey" id="dd-skip" style="flex:0 0 90px"><?php echo _l('dd_skip'); ?></button>
      <button type="button" class="dd-btn" id="dd-nextq"><?php echo _l('dd_next'); ?></button>
    </div>
    <?php } ?>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
<script>
(function () {
  'use strict';

  var root = document.getElementById('dd-details');
  if (!root) { return; }

  var requestId = root.getAttribute('data-request');
  var cards     = root.querySelectorAll('.dd-q');
  var dots      = document.getElementById('dd-dots');
  if (!cards.length) { return; }

  var index = 0;

  function showCard(i) {
    index = Math.max(0, Math.min(cards.length - 1, i));

    for (var c = 0; c < cards.length; c++) {
      cards[c].classList.toggle('active', c === index);
    }

    if (dots) {
      var spans = dots.querySelectorAll('span');
      for (var d = 0; d < spans.length; d++) { spans[d].classList.toggle('on', d === index); }
    }

    document.getElementById('dd-nextq').textContent =
      index === cards.length - 1 ? '<?php echo _l('dd_save'); ?>' : '<?php echo _l('dd_next'); ?>';
  }

  function readValue(card) {
    var type = card.getAttribute('data-input');

    if (type === 'select' || type === 'item_ref') {
      var sel = card.querySelector('.dd-opt.sel');
      return sel ? sel.getAttribute('data-value') : null;
    }

    if (type === 'number') {
      var v = card.querySelector('.v');
      return v ? v.getAttribute('data-value') : null;
    }

    if (type === 'toggle') {
      var t = card.querySelector('.dd-tog.sel');
      return t ? t.getAttribute('data-value') : null;
    }

    if (type === 'photo') { return null; }

    var input = card.querySelector('.dd-val');
    return input && input.value !== '' ? input.value : null;
  }

  /* Save on every advance. Abandoning halfway must lose nothing. */
  function saveCurrent() {
    var card  = cards[index];
    var key   = card.getAttribute('data-key');
    var value = readValue(card);

    if (value === null) { return Promise.resolve({ ok: true }); }

    var payload = { fields: {} };
    payload.fields[key] = value;

    return DD.post(window.__dd_urls.details + requestId, payload).then(function (res) {
      if (res.ok && dots) {
        var spans = dots.querySelectorAll('span');
        if (spans[index]) { spans[index].classList.add('done'); }
      }
      return res;
    });
  }

  function advance() {
    saveCurrent().then(function (res) {
      /*
       * A refused answer used to advance anyway and finish with "Saved",
       * so a rejected value was silently thrown away. Say what the server
       * said and stay on the card so it can be corrected.
       */
      if (res && res.ok === false) {
        DD.toast(res.error || '');
        return;
      }

      if (index === cards.length - 1) {
        DD.toast('<?php echo _l('dd_saved'); ?>');
        setTimeout(function () {
          window.location.href = '<?php echo admin_url('dealer_desk/m_request/'); ?>' + requestId;
        }, 500);
      } else {
        showCard(index + 1);
      }
    });
  }

  document.getElementById('dd-nextq').addEventListener('click', advance);
  document.getElementById('dd-prev').addEventListener('click', function () { showCard(index - 1); });
  document.getElementById('dd-skip').addEventListener('click', function () {
    if (index === cards.length - 1) {
      window.location.href = '<?php echo admin_url('dealer_desk/m_request/'); ?>' + requestId;
    } else {
      showCard(index + 1);
    }
  });

  /* Option pick — selecting is a decision, so move on without a second tap. */
  root.addEventListener('click', function (e) {
    var opt = e.target.closest('.dd-opt');
    if (opt) {
      var list = opt.closest('.dd-opts').querySelectorAll('.dd-opt');
      for (var i = 0; i < list.length; i++) { list[i].classList.remove('sel'); }
      opt.classList.add('sel');
      setTimeout(advance, 140);
      return;
    }

    var tog = e.target.closest('.dd-tog');
    if (tog) {
      var togs = tog.parentNode.querySelectorAll('.dd-tog');
      for (var t = 0; t < togs.length; t++) { togs[t].classList.remove('sel'); }
      tog.classList.add('sel');
      setTimeout(advance, 140);
      return;
    }

    var step = e.target.closest('[data-delta]');
    if (step) {
      var v   = step.parentNode.querySelector('.v');
      var cur = parseInt(v.getAttribute('data-value'), 10) || 0;
      var nv  = Math.max(0, cur + parseInt(step.getAttribute('data-delta'), 10));
      v.setAttribute('data-value', nv);
      v.textContent = nv;
    }
  });

  /*
   * Filter the options already on the card, then — for a catalogue-backed
   * field — ask the server for anything past them. The card only carries the
   * opening page of the catalogue, so a spare part further down the
   * alphabet was previously unreachable no matter what was typed.
   */
  var searchTimer = null;
  var lastQuery   = '';

  function appendResults(card, results) {
    var list  = card.querySelector('.dd-opts');
    if (!list) { return; }

    var known = {};
    var opts  = list.querySelectorAll('.dd-opt');
    for (var i = 0; i < opts.length; i++) { known[opts[i].getAttribute('data-value')] = true; }

    results.forEach(function (item) {
      if (known[String(item.value)]) { return; }

      var el = document.createElement('div');
      el.className = 'dd-opt';
      el.setAttribute('data-value', item.value);
      el.setAttribute('data-label', String(item.label).toLowerCase());
      el.setAttribute('data-remote', '1');
      el.textContent = item.label;
      list.appendChild(el);
    });
  }

  function filterCard(card, q) {
    var opts = card.querySelectorAll('.dd-opt');
    for (var i = 0; i < opts.length; i++) {
      opts[i].style.display = (q === '' || opts[i].getAttribute('data-label').indexOf(q) !== -1) ? 'block' : 'none';
    }
  }

  root.addEventListener('input', function (e) {
    if (!e.target.classList.contains('dd-opt-filter')) { return; }

    var card = e.target.closest('.dd-q');
    var q    = e.target.value.trim().toLowerCase();

    filterCard(card, q);

    if (card.getAttribute('data-source') !== 'items'
        && card.getAttribute('data-source') !== 'items_group') {
      return;
    }

    lastQuery = q;
    clearTimeout(searchTimer);

    if (q.length < 2) { return; }

    searchTimer = setTimeout(function () {
      var url = '<?php echo admin_url('dealer_desk/item_search'); ?>'
        + '?type_id=<?php echo (int) $request->type_id; ?>'
        + '&field=' + encodeURIComponent(card.getAttribute('data-key'))
        + '&q=' + encodeURIComponent(q);

      fetch(url, { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (q !== lastQuery) { return; }      // a newer keystroke won
          appendResults(card, (res && res.results) || []);
          filterCard(card, q);
        })
        .catch(function () {});
    }, 250);
  });

  /* Photo fields upload immediately, then advance. */
  root.addEventListener('change', function (e) {
    if (!e.target.classList.contains('dd-photo')) { return; }
    if (!e.target.files || !e.target.files[0]) { return; }

    var file = e.target.files[0];
    DD.upload(window.__dd_urls.upload + requestId, file, file.name).then(function (res) {
      if (res.ok) {
        var card = e.target.closest('.dd-q');
        var key  = card.getAttribute('data-key');
        var payload = { fields: {} };
        payload.fields[key] = file.name;
        DD.post(window.__dd_urls.details + requestId, payload).then(function () {
          DD.toast('<?php echo _l('dd_saved'); ?>');
          advance();
        });
      } else {
        DD.toast(res.error || '');
      }
    });
  });

  showCard(0);
}());
</script>
</body>
</html>
