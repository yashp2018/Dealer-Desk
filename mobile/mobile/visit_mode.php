<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M6 — Visit Mode.
 *
 * There is deliberately no missed-call catcher: logging a call is the
 * employee's responsibility, not the system's. What the screen provides
 * instead is a capture sheet that never loses visit context, and one prompt
 * at the end. The visit timer keeps running throughout.
 */
$elapsed = $visit->started_at ? (time() - strtotime($visit->started_at)) : 0;
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m" id="dd-visit" data-visit="<?php echo (int) $visit->id; ?>">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <span class="dd-ref"><?php echo html_escape($visit->ref_no); ?></span>
      </div>

      <div class="dd-visit-hd">
        <div class="st">
          <span>
            <i class="fa fa-industry"></i>
            <?php echo $visit->status === 'in_progress' ? _l('dd_visit_in_progress') : html_escape($visit->title); ?>
          </span>
          <?php if ($visit->status === 'in_progress') { ?>
            <span class="el" id="dd-elapsed" data-start="<?php echo (int) $elapsed; ?>">0 min</span>
          <?php } else { ?>
            <span class="el"><?php echo date('H:i', strtotime($visit->scheduled_at)); ?></span>
          <?php } ?>
        </div>
        <div class="who"><?php echo html_escape($visit->dealer_name); ?></div>
        <div class="sub">
          <?php echo html_escape($visit->dealer_city); ?>
          <?php if ($visit->is_prospect) { ?> · <span class="dd-pill dd-pill-new"><?php echo _l('dd_prospect'); ?></span><?php } ?>
        </div>
        <?php if ($attendees) { ?>
          <div class="sub" style="margin-top:6px">
            <i class="fa fa-users"></i> <?php echo html_escape(implode(', ', $attendees)); ?>
          </div>
        <?php } ?>
      </div>

      <?php if ($visit->status === 'planned') { ?>
        <a href="<?php echo admin_url('dealer_desk/start_visit/' . $visit->id); ?>" class="dd-btn" style="width:100%">
          <i class="fa fa-play"></i> <?php echo _l('dd_start_visit'); ?>
        </a>
      <?php } ?>

      <?php if ($agenda) { ?>
        <div class="dd-sec"><?php echo _l('dd_agenda'); ?></div>
        <ul class="dd-agenda" id="dd-agenda">
          <?php foreach ($agenda as $i => $line) {
              $text = is_array($line) ? (isset($line['text']) ? $line['text'] : '') : $line;
              $done = is_array($line) && !empty($line['done']);
          ?>
            <li class="<?php echo $done ? 'on' : ''; ?>" data-i="<?php echo $i; ?>">
              <span class="bx"><i class="fa <?php echo $done ? 'fa-square-check' : 'fa-square'; ?>"></i></span>
              <span class="tx"><?php echo html_escape($text); ?></span>
            </li>
          <?php } ?>
        </ul>
      <?php } ?>

      <div class="dd-sec"><?php echo _l('dd_note'); ?></div>
      <div style="display:flex;gap:8px">
        <button type="button" class="dd-btn grey" id="dd-vnote" style="flex:1">
          <i class="fa fa-microphone"></i> <span id="dd-vnote-l"><?php echo _l('dd_hold_to_talk'); ?></span>
        </button>
        <label class="dd-btn grey" style="flex:0 0 70px;margin:0">
          <i class="fa fa-camera"></i>
          <input type="file" accept="image/*" capture="environment" id="dd-vphoto" style="display:none">
        </label>
      </div>

      <?php if ($attachments) { ?>
        <div style="margin-top:12px">
          <?php foreach ($attachments as $file) { ?>
            <?php if ($file->kind === 'voice') { ?>
              <audio controls preload="none" style="width:100%;margin-bottom:6px"
                     src="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>"></audio>
            <?php } else { ?>
              <a class="dd-btn grey sm" style="display:block;margin-bottom:6px" target="_blank" rel="noopener"
                 href="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>">
                <i class="fa fa-paperclip"></i> <?php echo html_escape($file->file_name); ?>
              </a>
            <?php } ?>
          <?php } ?>
        </div>
      <?php } ?>

      <?php
        /*
         * Logging a call mid-visit is the employee's job, so the system's
         * contribution is to make it cost nothing: this opens capture as a
         * sheet over the visit and returns here on save.
         */
      ?>
      <div class="dd-sec"><?php echo _l('dd_requests'); ?></div>
      <a href="<?php echo admin_url('dealer_desk/m_capture?visit=' . $visit->id . ($visit->dealer_id ? '&dealer=' . $visit->dealer_id : '')); ?>"
         class="dd-btn ghost" style="width:100%;border:1px dashed var(--dd-accent)">
        + <?php echo _l('dd_log_a_call'); ?>
      </a>

      <?php if ($visit_requests) { ?>
        <div style="margin-top:12px">
          <?php foreach ($visit_requests as $request) {
              $this->load->view('dealer_desk/mobile/_request_item', ['request' => $request, 'show_late' => false]);
          } ?>
        </div>
      <?php } ?>

      <?php if ($visit->status === 'in_progress') { ?>
        <div style="margin-top:24px">
          <button type="button" class="dd-btn ok" style="width:100%" id="dd-end-visit">
            <i class="fa fa-check"></i> <?php echo _l('dd_end_visit'); ?>
          </button>
        </div>
      <?php } ?>

      <?php if ($visit->status === 'done') { ?>
        <div class="dd-sec"><?php echo _l('dd_log_outcome'); ?></div>
        <div class="dd-item" style="cursor:default">
          <span class="what">
            <strong><?php echo strtoupper($visit->outcome ?: '—'); ?></strong>
            · <?php echo html_escape($visit->next_step ?: '—'); ?>
            <?php if ($visit->next_at) { ?> · <?php echo _dt($visit->next_at); ?><?php } ?>
          </span>
          <?php if ($visit->outcome_note) { ?>
            <span class="what"><?php echo html_escape($visit->outcome_note); ?></span>
          <?php } ?>
        </div>
      <?php } ?>

    </div>

    <!-- Outcome sheet: four questions, twenty seconds -->
    <div class="dd-sheet-backdrop" id="dd-backdrop"></div>
    <div class="dd-sheet" id="dd-sheet">
      <div class="grab"></div>
      <div class="dd-outcome-q">
        <div class="q">1. <?php echo _l('dd_q_how_did_it_go'); ?></div>
        <div class="dd-choice" data-group="outcome">
          <button type="button" data-v="good">👍 <?php echo _l('dd_outcome_good'); ?></button>
          <button type="button" data-v="maybe">😐 <?php echo _l('dd_outcome_maybe'); ?></button>
          <button type="button" data-v="no">👎 <?php echo _l('dd_outcome_no'); ?></button>
        </div>
      </div>
      <div class="dd-outcome-q">
        <div class="q">2. <?php echo _l('dd_q_next_step'); ?></div>
        <div class="dd-choice" data-group="next_step">
          <button type="button" data-v="onboard"><?php echo _l('dd_next_onboard'); ?></button>
          <button type="button" data-v="follow_up"><?php echo _l('dd_next_follow_up'); ?></button>
          <button type="button" data-v="drop"><?php echo _l('dd_next_drop'); ?></button>
        </div>
      </div>
      <div class="dd-outcome-q">
        <div class="q">3. <?php echo _l('dd_q_when'); ?></div>
        <div class="dd-choice" data-group="when">
          <button type="button" data-v="week"><?php echo _l('dd_when_this_week'); ?></button>
          <button type="button" data-v="next"><?php echo _l('dd_when_pick'); ?></button>
          <button type="button" data-v="none"><?php echo _l('dd_none'); ?></button>
        </div>
        <input type="date" class="dd-input" id="dd-next-date" style="display:none;margin-top:8px">
      </div>
      <div class="dd-outcome-q">
        <div class="q">4. <?php echo _l('dd_q_note'); ?></div>
        <textarea class="dd-input" id="dd-outcome-note" rows="2"></textarea>
      </div>
      <div style="display:flex;gap:8px">
        <button type="button" class="dd-btn grey" id="dd-sheet-cancel" style="flex:0 0 100px"><?php echo _l('dd_cancel'); ?></button>
        <button type="button" class="dd-btn ok" id="dd-sheet-save" style="flex:1"><?php echo _l('dd_save'); ?></button>
      </div>
    </div>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
<script>
(function () {
  'use strict';

  var visitId = <?php echo (int) $visit->id; ?>;

  /* ---- Elapsed timer ---- */

  var elapsedEl = document.getElementById('dd-elapsed');
  if (elapsedEl) {
    var base = parseInt(elapsedEl.getAttribute('data-start'), 10) || 0;
    var tick = function () {
      base += 1;
      elapsedEl.textContent = Math.floor(base / 60) + ' min';
    };
    elapsedEl.textContent = Math.floor(base / 60) + ' min';
    setInterval(tick, 1000);
  }

  /* ---- Agenda ticks, saved with the outcome ---- */

  var agenda = document.getElementById('dd-agenda');
  if (agenda) {
    agenda.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      if (!li) { return; }
      li.classList.toggle('on');
      var icon = li.querySelector('.bx i');
      icon.className = li.classList.contains('on') ? 'fa fa-square-check' : 'fa fa-square';
    });
  }

  function agendaState() {
    if (!agenda) { return []; }
    var out = [];
    var items = agenda.querySelectorAll('li');
    for (var i = 0; i < items.length; i++) {
      out.push({ text: items[i].querySelector('.tx').textContent.trim(), done: items[i].classList.contains('on') });
    }
    return out;
  }

  /* ---- Voice note and photo, attached to the visit ---- */

  var recorder = null, chunks = [];
  var vnote = document.getElementById('dd-vnote');

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
        var blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        DD.upload('<?php echo admin_url('dealer_desk/upload_visit/'); ?>' + visitId, blob, 'note.webm')
          .then(function () { window.location.reload(); });
        stream.getTracks().forEach(function (t) { t.stop(); });
      };
      recorder.start();
      document.getElementById('dd-vnote-l').textContent = '● recording';
    }).catch(function () { DD.toast('Microphone permission denied.'); });
  }

  function stopRec() { if (recorder && recorder.state === 'recording') { recorder.stop(); } }

  vnote.addEventListener('mousedown', startRec);
  vnote.addEventListener('touchstart', function (e) { e.preventDefault(); startRec(); });
  vnote.addEventListener('mouseup', stopRec);
  vnote.addEventListener('mouseleave', stopRec);
  vnote.addEventListener('touchend', function (e) { e.preventDefault(); stopRec(); });

  document.getElementById('dd-vphoto').addEventListener('change', function (e) {
    if (!e.target.files || !e.target.files[0]) { return; }
    var file = e.target.files[0];
    DD.upload('<?php echo admin_url('dealer_desk/upload_visit/'); ?>' + visitId, file, file.name)
      .then(function () { window.location.reload(); });
  });

  /* ---- Outcome sheet ---- */

  var sheet    = document.getElementById('dd-sheet');
  var backdrop = document.getElementById('dd-backdrop');
  var answers  = { outcome: null, next_step: null, when: null };

  function openSheet() { backdrop.classList.add('open'); sheet.classList.add('open'); }
  function closeSheet() { backdrop.classList.remove('open'); sheet.classList.remove('open'); }

  var endBtn = document.getElementById('dd-end-visit');
  if (endBtn) { endBtn.addEventListener('click', openSheet); }
  backdrop.addEventListener('click', closeSheet);
  document.getElementById('dd-sheet-cancel').addEventListener('click', closeSheet);

  sheet.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-v]');
    if (!btn) { return; }

    var group = btn.closest('[data-group]');
    var name  = group.getAttribute('data-group');
    var all   = group.querySelectorAll('button');

    for (var i = 0; i < all.length; i++) { all[i].classList.remove('sel'); }
    btn.classList.add('sel');
    answers[name] = btn.getAttribute('data-v');

    if (name === 'when') {
      document.getElementById('dd-next-date').style.display = answers.when === 'next' ? 'block' : 'none';
    }
  });

  function nextAt() {
    if (answers.when === 'none' || !answers.when) { return null; }
    if (answers.when === 'next') {
      var v = document.getElementById('dd-next-date').value;
      return v ? v + ' 10:00:00' : null;
    }
    var d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(10, 0, 0, 0);
    return DD.toSqlDateTime(d);
  }

  document.getElementById('dd-sheet-save').addEventListener('click', function () {
    var payload = {
      outcome:   answers.outcome || '',
      next_step: answers.next_step || '',
      note:      document.getElementById('dd-outcome-note').value,
      agenda:    JSON.stringify(agendaState())
    };

    var when = nextAt();
    if (when) { payload.next_at = when; }

    DD.post('<?php echo admin_url('dealer_desk/visit_outcome/'); ?>' + visitId, payload).then(function (res) {
      if (!res.ok) { DD.toast(res.error || ''); return; }

      closeSheet();

      /*
       * One prompt, not automation. The employee decides whether anything
       * else needs logging; the system just makes it one tap away.
       */
      if (window.confirm('<?php echo _l('dd_anything_else'); ?>')) {
        window.location.href = '<?php echo admin_url('dealer_desk/m_capture?visit='); ?>' + visitId;
      } else {
        window.location.href = '<?php echo admin_url('dealer_desk/m'); ?>';
      }
    });
  });
}());
</script>
</body>
</html>
