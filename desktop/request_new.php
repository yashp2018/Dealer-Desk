<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * Desktop capture.
 *
 * The mobile wizard asks one question per screen because a thumb on a
 * moving bike can only answer one. At a desk the opposite is true: every
 * decision is on screen at once, the SLA consequence of the type choice is
 * visible before you commit, and nothing is hidden behind a "next".
 */
?>
<div id="wrapper">
  <div class="content">

    <div class="dd-panel">
      <div class="hd">
        <?php echo _l('dd_new_request_desktop'); ?>
        <span class="right">
          <a href="<?php echo admin_url('dealer_desk/requests'); ?>" class="btn btn-default btn-xs">
            <?php echo _l('dd_back_to_requests'); ?>
          </a>
        </span>
      </div>
    </div>

    <form action="<?php echo admin_url('dealer_desk/store_request'); ?>" method="post" id="dd-new-request">
<?php echo dd_csrf_field(); ?>

      <div class="dd-form-cols">

        <!-- ============ Who and what ============ -->
        <div class="col-main">

          <div class="dd-panel">
            <div class="hd"><span class="dd-stepno">1</span> <?php echo _l('dd_pick_dealer'); ?></div>
            <div class="bd">
              <select name="dealer_id" id="dd-dealer" class="form-control" required>
                <option value=""><?php echo _l('dd_search_dealer'); ?></option>
                <?php foreach ($dealers as $d) { ?>
                  <option value="<?php echo (int) $d->id; ?>"
                    <?php echo (int) $dealer_id === (int) $d->id ? 'selected' : ''; ?>>
                    <?php echo html_escape($d->name); ?>
                    <?php echo $d->city ? ' — ' . html_escape($d->city) : ''; ?>
                    <?php echo $d->dealer_code ? ' (' . html_escape($d->dealer_code) . ')' : ''; ?>
                  </option>
                <?php } ?>
              </select>
              <p class="dd-hint"><?php echo _l('dd_pick_dealer_hint'); ?></p>
            </div>
          </div>

          <div class="dd-panel">
            <div class="hd"><span class="dd-stepno">2</span> <?php echo _l('dd_pick_type'); ?></div>
            <div class="bd">
              <div class="dd-typegrid">
                <?php foreach ($types as $type) { ?>
                  <label class="dd-typecard">
                    <input type="radio" name="type_id" value="<?php echo (int) $type->id; ?>"
                           data-sla="<?php echo (int) $type->sla_hours; ?>"
                           data-priority="<?php echo (int) $type->default_priority; ?>"
                           data-target="<?php echo html_escape(dd_push_target_label($type->push_target)); ?>"
                           data-target-state="<?php echo html_escape(dd_push_target_state($type->push_target)); ?>"
                           required>
                    <span class="face">
                      <i class="fa <?php echo html_escape($type->icon); ?>"
                         style="color:<?php echo html_escape($type->color); ?>"></i>
                      <span class="nm"><?php echo html_escape($type->name); ?></span>
                      <span class="mt">
                        <?php echo dd_priority_label($type->default_priority); ?>
                        · <?php echo (int) $type->sla_hours; ?>h
                      </span>
                    </span>
                  </label>
                <?php } ?>
              </div>
            </div>
          </div>

          <div class="dd-panel">
            <div class="hd"><span class="dd-stepno">3</span> <?php echo _l('dd_anything_else'); ?></div>
            <div class="bd">
              <div class="form-group">
                <label for="dd-title"><?php echo _l('dd_title_optional'); ?></label>
                <input type="text" name="title" id="dd-title" class="form-control" maxlength="191">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label for="dd-desc"><?php echo _l('dd_description'); ?></label>
                <textarea name="description" id="dd-desc" class="form-control" rows="3"></textarea>
              </div>
            </div>
          </div>

        </div>

        <!-- ============ How it will be handled ============ -->
        <div class="col-side">

          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_whats_next'); ?></div>
            <div class="bd">
              <table class="dd-kv">
                <tr>
                  <td class="k"><?php echo _l('dd_priority'); ?></td>
                  <td>
                    <select name="priority" class="form-control input-sm" id="dd-priority">
                      <option value=""><?php echo _l('dd_priority_auto'); ?></option>
                      <?php foreach ([1, 2, 3] as $p) { ?>
                        <option value="<?php echo $p; ?>"><?php echo dd_priority_label($p); ?></option>
                      <?php } ?>
                    </select>
                    <p class="dd-hint" style="margin-top:6px"><?php echo _l('dd_priority_auto_hint'); ?></p>
                  </td>
                </tr>
                <tr>
                  <td class="k"><?php echo _l('dd_due'); ?></td>
                  <td><span id="dd-sla-preview" class="dd-muted">—</span></td>
                </tr>
                <tr>
                  <td class="k"><?php echo _l('dd_push_target'); ?></td>
                  <td><span id="dd-target-preview" class="dd-muted">—</span></td>
                </tr>
                <tr>
                  <td class="k"><?php echo _l('dd_owner'); ?></td>
                  <td>
                    <select name="owner_staff_id" class="form-control input-sm">
                      <option value=""><?php echo _l('dd_priority_auto'); ?></option>
                      <?php foreach ($staff as $member) { ?>
                        <option value="<?php echo (int) $member->staffid; ?>"
                          <?php echo (int) $member->staffid === (int) get_staff_user_id() ? 'selected' : ''; ?>>
                          <?php echo html_escape($member->name); ?>
                        </option>
                      <?php } ?>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="k"><?php echo _l('dd_schedule'); ?></td>
                  <td>
                    <input type="datetime-local" name="scheduled_at" class="form-control input-sm"
                           value="<?php echo date('Y-m-d\TH:i'); ?>">
                  </td>
                </tr>
              </table>

              <button type="submit" class="btn btn-primary btn-block" style="margin-top:16px">
                <?php echo _l('dd_create'); ?>
              </button>
            </div>
          </div>

        </div>
      </div>
    </form>

  </div>
</div>

<script>
(function () {
  'use strict';

  var form = document.getElementById('dd-new-request');
  if (!form) { return; }

  var slaEl    = document.getElementById('dd-sla-preview');
  var targetEl = document.getElementById('dd-target-preview');
  var prioEl   = document.getElementById('dd-priority');

  /* Show the consequences of the type choice before it is committed:
     when it falls due, and which ERP document it will produce. */
  function preview(radio) {
    var hours = parseInt(radio.getAttribute('data-sla'), 10) || 24;
    var due   = new Date(Date.now() + hours * 3600 * 1000);

    slaEl.textContent = due.toLocaleString() + ' (' + hours + 'h)';
    slaEl.className   = '';

    var state = radio.getAttribute('data-target-state');
    targetEl.textContent = radio.getAttribute('data-target');
    targetEl.className   = state === 'ready' ? '' : 'dd-muted';

    if (prioEl.value === '') {
      prioEl.setAttribute('data-auto', radio.getAttribute('data-priority'));
    }
  }

  form.addEventListener('change', function (e) {
    if (e.target.name === 'type_id') { preview(e.target); }
  });

  var checked = form.querySelector('input[name="type_id"]:checked');
  if (checked) { preview(checked); }
}());
</script>

<?php init_tail(); ?>
</body>
</html>
