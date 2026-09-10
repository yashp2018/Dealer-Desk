<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M2 — Quick Capture. Four taps and Save.
 *
 * Caller ID is deliberately not used, so the dealer picker carries the whole
 * load. It searches a dictionary already on the page: no network call, no
 * spinner, no waiting while a dealer is talking.
 */
$recentIds = array_map(function ($r) { return (int) $r['dealer_id']; }, $recent);
$byId      = [];
foreach ($dealers as $dealer) {
    $byId[(int) $dealer->id] = $dealer;
}
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m" id="dd-capture"
         data-visit="<?php echo (int) $visit_id; ?>"
         data-preset-dealer="<?php echo (int) $dealer_id; ?>">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <div class="d" style="font-size:15px"><?php echo _l('dd_new_request'); ?></div>
        <div class="sp"></div>
        <div class="dd-eyebrow" id="dd-stepno">1 / 3</div>
      </div>

      <!-- ============ STEP 1 — WHO ============ -->
      <div class="dd-step active" data-step="1">
        <div class="dd-step-h"><?php echo _l('dd_step_who'); ?></div>

        <input type="text" class="dd-search" id="dd-dealer-search"
               placeholder="<?php echo _l('dd_search_dealer'); ?>" autocomplete="off">

        <?php if ($recentIds) { ?>
          <div class="dd-eyebrow" style="margin-bottom:6px"><?php echo _l('dd_recent'); ?></div>
          <div class="dd-recent" id="dd-recent">
            <?php foreach ($recentIds as $rid) {
                if (!isset($byId[$rid])) { continue; }
                $dealer = $byId[$rid]; ?>
              <div class="r" data-id="<?php echo $dealer->id; ?>" data-name="<?php echo html_escape($dealer->name); ?>">
                <?php echo html_escape($dealer->name); ?>
                <span class="c"><?php echo html_escape($dealer->city); ?></span>
              </div>
            <?php } ?>
          </div>
        <?php } ?>

        <div class="dd-eyebrow" style="margin:14px 0 6px" id="dd-list-label"><?php echo _l('dd_my_dealers'); ?></div>
        <div class="dd-list" id="dd-dealer-list">
          <?php foreach ($dealers as $dealer) { ?>
            <div class="row-d"
                 data-id="<?php echo $dealer->id; ?>"
                 data-name="<?php echo html_escape($dealer->name); ?>"
                 data-mine="<?php echo ((int) $dealer->owner_staff_id === (int) $my_staff_id) ? 1 : 0; ?>"
                 data-search="<?php echo html_escape(strtolower($dealer->name . ' ' . $dealer->city . ' ' . $dealer->dealer_code . ' ' . preg_replace('/[^0-9]/', '', (string) $dealer->phone))); ?>">
              <span>
                <span class="nm"><?php echo html_escape($dealer->name); ?></span>
                <span class="ct"><?php echo html_escape($dealer->city); ?><?php echo $dealer->dealer_code ? ' · ' . html_escape($dealer->dealer_code) : ''; ?></span>
              </span>
            </div>
          <?php } ?>
        </div>

        <div class="dd-empty" id="dd-no-dealer" style="display:none">
          <?php echo _l('dd_not_in_list'); ?>
        </div>
      </div>

      <!-- ============ STEP 2 — WHAT ============ -->
      <div class="dd-step" data-step="2">
        <div class="dd-step-h"><?php echo _l('dd_step_what'); ?></div>
        <div class="dd-tiles">
          <?php foreach ($types as $type) { ?>
            <div class="dd-tile" data-type="<?php echo $type->id; ?>"
                 data-sla="<?php echo (int) $type->sla_hours; ?>"
                 data-name="<?php echo html_escape($type->name); ?>">
              <i class="fa <?php echo html_escape($type->icon ?: 'fa-circle'); ?>"
                 style="color:<?php echo html_escape($type->color ?: '#0b6272'); ?>"></i>
              <div class="t"><?php echo html_escape($type->name); ?></div>
            </div>
          <?php } ?>
        </div>
      </div>

      <!-- ============ STEP 3 — WHEN ============ -->
      <div class="dd-step" data-step="3">
        <div class="dd-step-h"><?php echo _l('dd_step_when'); ?></div>
        <div class="dd-when">
          <button type="button" data-when="today"><?php echo _l('dd_when_today'); ?></button>
          <button type="button" data-when="tomorrow"><?php echo _l('dd_when_tomorrow'); ?></button>
          <button type="button" data-when="week"><?php echo _l('dd_when_this_week'); ?></button>
          <button type="button" data-when="pick"><?php echo _l('dd_when_pick'); ?></button>
        </div>
        <input type="date" class="dd-input" id="dd-pickdate" style="display:none;margin-top:10px">

        <div style="margin-top:20px;padding:14px;background:var(--dd-panel-2);border-radius:5px">
          <div class="dd-eyebrow" style="margin-bottom:6px"><?php echo _l('dd_capture'); ?></div>
          <div id="dd-summary" style="font-size:15px;font-weight:600"></div>
        </div>
      </div>

      <!-- The pressure valve: when even three taps is too many. -->
      <div style="margin-top:18px">
        <button type="button" class="dd-btn grey" id="dd-voice" style="width:100%">
          <i class="fa fa-microphone"></i> <span id="dd-voice-label"><?php echo _l('dd_hold_to_talk'); ?></span>
        </button>
        <audio id="dd-voice-play" controls style="display:none;width:100%;margin-top:8px"></audio>
      </div>

    </div>

    <div class="dd-sticky-foot">
      <button type="button" class="dd-btn grey" id="dd-back" style="flex:0 0 90px"><?php echo _l('dd_back'); ?></button>
      <button type="button" class="dd-btn" id="dd-next" disabled><?php echo _l('dd_next'); ?></button>
    </div>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
<script>
(function () {
  'use strict';

  var root      = document.getElementById('dd-capture');
  if (!root) { return; }

  var state = { step: 1, dealerId: null, dealerName: '', typeId: null, typeName: '', sla: 24, when: null, voice: null };
  var visitId = parseInt(root.getAttribute('data-visit'), 10) || 0;

  var steps    = root.querySelectorAll('.dd-step');
  var stepNo   = document.getElementById('dd-stepno');
  var nextBtn  = document.getElementById('dd-next');
  var backBtn  = document.getElementById('dd-back');
  var listEl   = document.getElementById('dd-dealer-list');
  var searchEl = document.getElementById('dd-dealer-search');
  var labelEl  = document.getElementById('dd-list-label');
  var noneEl   = document.getElementById('dd-no-dealer');

  function show(step) {
    state.step = step;
    for (var i = 0; i < steps.length; i++) {
      steps[i].classList.toggle('active', parseInt(steps[i].getAttribute('data-step'), 10) === step);
    }
    stepNo.textContent = step + ' / 3';
    backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = step === 3 ? '<?php echo _l('dd_save'); ?>' : '<?php echo _l('dd_next'); ?>';

    // Whether the action is available depends on the step we just moved to,
    // so it has to be recomputed on every move — otherwise a pre-selected
    // choice looks chosen while the button stays dead.
    refreshNext();
    refreshNext();
    if (step === 3) { renderSummary(); }
  }

  function refreshNext() {
    var ok = (state.step === 1 && state.dealerId)
          || (state.step === 2 && state.typeId)
          || (state.step === 3 && state.when);
    nextBtn.disabled = !ok;
  }

  function renderSummary() {
    var el = document.getElementById('dd-summary');
    el.textContent = state.dealerName + ' · ' + state.typeName + ' · ' + whenLabel();
  }

  function whenLabel() {
    if (state.when === 'today')    { return '<?php echo _l('dd_when_today'); ?>'; }
    if (state.when === 'tomorrow') { return '<?php echo _l('dd_when_tomorrow'); ?>'; }
    if (state.when === 'week')     { return '<?php echo _l('dd_when_this_week'); ?>'; }
    return document.getElementById('dd-pickdate').value || '';
  }

  /* ---- Step 1: the picker. Local filtering only, never a network call. ---- */

  function filterList() {
    var q    = (searchEl.value || '').trim().toLowerCase();
    var rows = listEl.querySelectorAll('.row-d');
    var shown = 0;

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var match;
      if (q === '') {
        // With no query we show this employee's own dealers first.
        match = row.getAttribute('data-mine') === '1';
      } else {
        match = row.getAttribute('data-search').indexOf(q) !== -1;
      }
      row.style.display = match ? 'flex' : 'none';
      if (match) { shown++; }
    }

    // If the employee owns nobody yet, showing an empty list would be useless.
    if (q === '' && shown === 0) {
      for (var j = 0; j < rows.length; j++) { rows[j].style.display = 'flex'; shown = rows.length; }
      labelEl.textContent = '<?php echo _l('dd_all_dealers'); ?>';
    } else if (q !== '') {
      labelEl.textContent = '<?php echo _l('dd_search'); ?>';
    } else {
      labelEl.textContent = '<?php echo _l('dd_my_dealers'); ?>';
    }

    noneEl.style.display = shown === 0 ? 'block' : 'none';
  }

  function pickDealer(id, name, node) {
    state.dealerId   = id;
    state.dealerName = name;
    var sel = root.querySelectorAll('.row-d.sel, .dd-recent .r.sel');
    for (var i = 0; i < sel.length; i++) { sel[i].classList.remove('sel'); }
    if (node) { node.classList.add('sel'); }
    refreshNext();
    // Picking a dealer is a decision; move on without a second tap.
    setTimeout(function () { show(2); }, 120);
  }

  searchEl.addEventListener('input', filterList);

  listEl.addEventListener('click', function (e) {
    var row = e.target.closest('.row-d');
    if (row) { pickDealer(row.getAttribute('data-id'), row.getAttribute('data-name'), row); }
  });

  var recentEl = document.getElementById('dd-recent');
  if (recentEl) {
    recentEl.addEventListener('click', function (e) {
      var r = e.target.closest('.r');
      if (r) { pickDealer(r.getAttribute('data-id'), r.getAttribute('data-name'), r); }
    });
  }

  /* ---- Step 2: eight tiles, one tap ---- */

  root.querySelector('[data-step="2"]').addEventListener('click', function (e) {
    var tile = e.target.closest('.dd-tile');
    if (!tile) { return; }

    var tiles = root.querySelectorAll('.dd-tile');
    for (var i = 0; i < tiles.length; i++) { tiles[i].classList.remove('sel'); }
    tile.classList.add('sel');

    state.typeId   = tile.getAttribute('data-type');
    state.typeName = tile.getAttribute('data-name');
    state.sla      = parseInt(tile.getAttribute('data-sla'), 10) || 24;

    // Pre-select "when" from the type's own SLA — one tap to accept.
    state.when = state.sla <= 24 ? 'today' : (state.sla <= 48 ? 'tomorrow' : 'week');

    refreshNext();
    setTimeout(function () {
      show(3);
      var pre = root.querySelector('[data-when="' + state.when + '"]');
      if (pre) { pre.classList.add('sel'); }
      refreshNext();
    }, 120);
  });

  /* ---- Step 3: when ---- */

  root.querySelector('[data-step="3"]').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-when]');
    if (!btn) { return; }

    var all = root.querySelectorAll('[data-when]');
    for (var i = 0; i < all.length; i++) { all[i].classList.remove('sel'); }
    btn.classList.add('sel');

    state.when = btn.getAttribute('data-when');
    document.getElementById('dd-pickdate').style.display = state.when === 'pick' ? 'block' : 'none';
    refreshNext();
    renderSummary();
  });

  document.getElementById('dd-pickdate').addEventListener('change', renderSummary);

  /* ---- Voice note ---- */

  var recorder = null, chunks = [];
  var voiceBtn = document.getElementById('dd-voice');

  function startRec() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      DD.toast('Recording is not available in this browser.');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      recorder = new MediaRecorder(stream);
      chunks = [];
      recorder.ondataavailable = function (ev) { chunks.push(ev.data); };
      recorder.onstop = function () {
        state.voice = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        var player = document.getElementById('dd-voice-play');
        player.src = URL.createObjectURL(state.voice);
        player.style.display = 'block';
        document.getElementById('dd-voice-label').textContent = '<?php echo _l('dd_voice_note'); ?>';
        stream.getTracks().forEach(function (t) { t.stop(); });
      };
      recorder.start();
      document.getElementById('dd-voice-label').textContent = '● ' + '<?php echo _l('dd_voice_note'); ?>';
    }).catch(function () {
      DD.toast('Microphone permission denied.');
    });
  }

  function stopRec() {
    if (recorder && recorder.state === 'recording') { recorder.stop(); }
  }

  voiceBtn.addEventListener('mousedown', startRec);
  voiceBtn.addEventListener('touchstart', function (e) { e.preventDefault(); startRec(); });
  voiceBtn.addEventListener('mouseup', stopRec);
  voiceBtn.addEventListener('mouseleave', stopRec);
  voiceBtn.addEventListener('touchend', function (e) { e.preventDefault(); stopRec(); });

  /* ---- Save ---- */

  function scheduledAt() {
    var d = new Date();
    if (state.when === 'tomorrow') { d.setDate(d.getDate() + 1); }
    if (state.when === 'week')     { d.setDate(d.getDate() + 3); }
    if (state.when === 'pick') {
      var v = document.getElementById('dd-pickdate').value;
      if (v) { d = new Date(v + 'T10:00:00'); }
    }
    return DD.toSqlDateTime(d);
  }

  nextBtn.addEventListener('click', function () {
    if (state.step < 3) { show(state.step + 1); return; }

    nextBtn.disabled = true;

    DD.post('<?php echo admin_url('dealer_desk/create'); ?>', {
      client_uuid:  DD.uuid(),
      dealer_id:    state.dealerId,
      type_id:      state.typeId,
      scheduled_at: scheduledAt(),
      source:       'mobile'
    }).then(function (res) {
      if (!res.ok) {
        DD.toast(res.error || 'Could not save');
        nextBtn.disabled = false;
        return;
      }

      var done = function () {
        DD.toast('<?php echo _l('dd_saved'); ?> · ' + res.ref_no);
        setTimeout(function () {
          window.location.href = visitId
            ? '<?php echo admin_url('dealer_desk/m_visit/'); ?>' + visitId
            : '<?php echo admin_url('dealer_desk/m_request/'); ?>' + res.id;
        }, 500);
      };

      if (state.voice) {
        DD.upload('<?php echo admin_url('dealer_desk/upload/'); ?>' + res.id, state.voice, 'note.webm').then(done, done);
      } else {
        done();
      }
    });
  });

  backBtn.addEventListener('click', function () {
    if (state.step > 1) { show(state.step - 1); }
  });

  /* ---- Boot ---- */

  filterList();
  show(1);

  var preset = parseInt(root.getAttribute('data-preset-dealer'), 10) || 0;
  if (preset) {
    var node = listEl.querySelector('.row-d[data-id="' + preset + '"]');
    if (node) { pickDealer(preset, node.getAttribute('data-name'), node); }
  }
}());
</script>
</body>
</html>
