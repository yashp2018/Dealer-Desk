<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M3 — Request card.
 *
 * Call and WhatsApp sit at the top because they are the next action roughly
 * nine times in ten. History is collapsed to a few lines; the full record is
 * a desktop concern.
 */
$late  = !empty($request->due_at) && strtotime($request->due_at) < time();
$days  = $late ? dd_overdue_days($request->due_at) : 0;
$ready = $request->completion_required > 0 && $request->completion_done >= $request->completion_required;
$wa    = dd_whatsapp_link($request->dealer_whatsapp, sprintf('Ref %s — %s', $request->ref_no, $request->type_name));
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <span class="dd-ref"><?php echo html_escape($request->ref_no); ?></span>
        <div class="sp"></div>
        <span class="dd-pill <?php echo dd_priority_class($request->priority); ?>">
          <?php echo dd_priority_label($request->priority); ?>
        </span>
      </div>

      <div style="font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.15">
        <?php echo html_escape($request->dealer_name); ?>
      </div>
      <div class="dd-muted" style="font-size:13px;margin-top:2px">
        <?php echo html_escape($request->dealer_city); ?>
        <?php if ($request->dealer_id) {
            $dealer = $this->dd->get_dealer($request->dealer_id);
            if ($dealer && $dealer->tier_name) { ?>
          · <?php echo html_escape($dealer->tier_name); ?>
        <?php } } ?>
      </div>

      <div class="dd-contact-row">
        <a class="call <?php echo $request->dealer_phone ? '' : 'disabled'; ?>"
           href="tel:<?php echo html_escape($request->dealer_phone); ?>">
          <i class="fa fa-phone"></i> <?php echo _l('dd_call'); ?>
        </a>
        <a class="wa <?php echo $wa ? '' : 'disabled'; ?>"
           href="<?php echo $wa ? html_escape($wa) : '#'; ?>" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp"></i> <?php echo _l('dd_whatsapp'); ?>
        </a>
      </div>

      <div class="dd-item <?php echo dd_priority_class($request->priority); ?>" style="cursor:default">
        <span class="what" style="font-size:15px">
          <?php if ($request->type_icon) { ?><i class="fa <?php echo html_escape($request->type_icon); ?>"></i> <?php } ?>
          <strong><?php echo html_escape($request->type_name); ?></strong>
          <?php if ($request->title) { ?> · <?php echo html_escape($request->title); ?><?php } ?>
        </span>

        <span class="foot">
          <span class="dd-pill dd-pill-muted"><?php echo dd_status_label($request->status); ?></span>
          <?php if ($late) { ?>
            <span class="dd-late"><?php echo $days <= 1 ? _l('dd_day_late') : _l('dd_days_late', $days); ?></span>
          <?php } elseif ($request->due_at) { ?>
            <span class="dd-muted"><?php echo _l('dd_due'); ?> <?php echo _dt($request->due_at); ?></span>
          <?php } ?>
        </span>

        <?php if ($request->completion_required > 0) { ?>
          <div style="margin-top:10px">
            <span class="dd-progress <?php echo $ready ? 'complete' : ''; ?>">
              <span class="bar">
                <?php for ($i = 0; $i < $request->completion_required; $i++) { ?>
                  <span class="seg <?php echo $i < $request->completion_done ? 'on' : ''; ?>"></span>
                <?php } ?>
              </span>
              <?php echo _l('dd_details_progress', [(int) $request->completion_done, (int) $request->completion_required]); ?>
            </span>
          </div>
          <?php if (!empty($request->locked_at)) { ?>
            <span class="dd-inline-action ghost">
              <i class="fa fa-lock"></i> <?php echo dd_doc_state_label($request->doc_state); ?>
            </span>
          <?php } else { ?>
            <a href="<?php echo admin_url('dealer_desk/m_details/' . $request->id); ?>" class="dd-inline-action">
              <?php echo _l('dd_finish_details'); ?> <i class="fa fa-arrow-right"></i>
            </a>
          <?php } ?>
        <?php } ?>
      </div>

      <?php if ($attachments) { ?>
        <div class="dd-sec"><?php echo _l('dd_attachments'); ?></div>
        <?php foreach ($attachments as $file) { ?>
          <?php if ($file->kind === 'voice') { ?>
            <audio controls preload="none" style="width:100%;margin-bottom:8px"
                   src="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>"></audio>
          <?php } else { ?>
            <a href="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>" target="_blank" rel="noopener"
               class="dd-btn grey sm" style="margin-bottom:6px;display:block">
              <i class="fa fa-paperclip"></i> <?php echo html_escape($file->file_name); ?>
            </a>
          <?php } ?>
        <?php } ?>
      <?php } ?>

      <div class="dd-sec"><?php echo _l('dd_timeline'); ?></div>
      <ul class="dd-timeline">
        <?php foreach ($timeline as $entry) { ?>
          <li class="<?php echo $entry->actor_staff_id ? '' : 'sys'; ?>">
            <span class="meta">
              <?php echo dd_relative_time($entry->created_at); ?> ·
              <?php echo $entry->actor_staff_id ? html_escape(dd_staff_name($entry->actor_staff_id)) : 'System'; ?>
            </span>
            <?php echo html_escape($entry->summary); ?>
          </li>
        <?php } ?>
      </ul>
      <a href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>" class="dd-btn grey sm">
        <?php echo _l('dd_full_history'); ?>
      </a>

      <div class="dd-sec"><?php echo _l('dd_add_note'); ?></div>
      <textarea class="dd-input" id="dd-note" rows="2" placeholder="<?php echo _l('dd_note'); ?>"></textarea>
      <button type="button" class="dd-btn grey sm" id="dd-save-note" style="margin-top:8px">
        <?php echo _l('dd_save'); ?>
      </button>

    </div>

    <?php if (dd_is_open_status($request->status)) { ?>
    <div class="dd-sticky-foot">
      <button type="button" class="dd-btn ok" id="dd-done"><i class="fa fa-check"></i> <?php echo _l('dd_mark_done'); ?></button>
      <button type="button" class="dd-btn grey" id="dd-later" style="flex:0 0 110px">
        <i class="fa fa-clock"></i> <?php echo _l('dd_push_tomorrow'); ?>
      </button>
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

  var id = <?php echo (int) $request->id; ?>;

  var doneBtn = document.getElementById('dd-done');
  if (doneBtn) {
    doneBtn.addEventListener('click', function () {
      DD.post(window.__dd_urls.setStatus + id, { status: 'done' }).then(function (res) {
        if (res.ok) {
          DD.toast('✓ <?php echo _l('dd_status_done'); ?>');
          setTimeout(function () { window.location.href = '<?php echo admin_url('dealer_desk/m'); ?>'; }, 600);
          return;
        }

        // Closing an incomplete request forces a reason. Asking beats
        // silently losing the fact that it was closed early.
        if (res.needs_reason) {
          var reason = window.prompt('<?php echo _l('dd_err_reason_required'); ?>');
          if (!reason) { return; }
          DD.post(window.__dd_urls.setStatus + id, { status: 'done', reason: reason }).then(function (r2) {
            if (r2.ok) {
              DD.toast('✓ <?php echo _l('dd_status_done'); ?>');
              setTimeout(function () { window.location.href = '<?php echo admin_url('dealer_desk/m'); ?>'; }, 600);
            } else {
              DD.toast(r2.error || '');
            }
          });
          return;
        }

        DD.toast(res.error || '');
      });
    });
  }

  var laterBtn = document.getElementById('dd-later');
  if (laterBtn) {
    laterBtn.addEventListener('click', function () {
      var d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(10, 0, 0, 0);

      DD.post(window.__dd_urls.reschedule + id, { scheduled_at: DD.toSqlDateTime(d) }).then(function (res) {
        if (res.ok) {
          DD.toast('→ <?php echo _l('dd_when_tomorrow'); ?>');
          setTimeout(function () { window.location.href = '<?php echo admin_url('dealer_desk/m'); ?>'; }, 600);
        }
      });
    });
  }

  document.getElementById('dd-save-note').addEventListener('click', function () {
    var body = document.getElementById('dd-note').value.trim();
    if (!body) { return; }

    DD.post('<?php echo admin_url('dealer_desk/add_note/' . $request->id); ?>', { body: body }).then(function (res) {
      if (res.ok) { window.location.reload(); }
    });
  });
}());
</script>
</body>
</html>
