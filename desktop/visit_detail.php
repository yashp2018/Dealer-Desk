<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * Desktop visit detail.
 *
 * The desk reads a visit; the phone runs one. This screen is the record —
 * what was planned, what came out of it, and which open work sits with the
 * same dealer — with no live capture controls borrowed from Visit Mode.
 */
$agenda   = $visit->agenda_json ? json_decode($visit->agenda_json, true) : [];
$agenda   = is_array($agenda) ? $agenda : [];
$party    = $dealer ? $dealer->display_name : ($prospect ? $prospect->company_name : $visit->dealer_name);
$statuses = [
    'planned'     => _l('dd_visit_planned'),
    'in_progress' => _l('dd_visit_in_progress'),
    'done'        => _l('dd_visit_done'),
    'cancelled'   => _l('dd_status_cancelled'),
];
$status_label = isset($statuses[$visit->status]) ? $statuses[$visit->status] : $visit->status;
?>
<div id="wrapper">
  <div class="content">

    <div class="dd-reqhead">
      <div class="lead">
        <div class="ref">
          <span class="dd-pill dd-pill-new"><?php echo _l('dd_visit'); ?></span>
          <span class="dd-ref"><?php echo html_escape($visit->ref_no); ?></span>
        </div>
        <h1>
          <?php if ($dealer) { ?>
            <a href="<?php echo admin_url('dealer_desk/dealer/' . $dealer->id); ?>">
              <?php echo html_escape($party); ?>
            </a>
          <?php } elseif ($prospect) { ?>
            <a href="<?php echo admin_url('dealer_desk/prospect/' . $prospect->id); ?>">
              <?php echo html_escape($party); ?>
            </a>
            <span class="dd-pill dd-pill-new"><?php echo _l('dd_prospect'); ?></span>
          <?php } else { ?>
            <?php echo html_escape($party); ?>
          <?php } ?>
        </h1>
        <div class="sub"><?php echo html_escape($visit->title); ?></div>
      </div>

      <div class="facts">
        <div class="fact">
          <div class="l"><?php echo _l('dd_status'); ?></div>
          <div class="v"><span class="dd-pill dd-pill-muted"><?php echo html_escape($status_label); ?></span></div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_schedule'); ?></div>
          <div class="v"><?php echo $visit->scheduled_at ? _dt($visit->scheduled_at) : '—'; ?></div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_owner'); ?></div>
          <div class="v"><?php echo html_escape(dd_staff_name($visit->owner_staff_id)); ?></div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_outcome'); ?></div>
          <div class="v">
            <?php echo $visit->outcome
                ? html_escape($visit->outcome)
                : '<span class="dd-muted">—</span>'; ?>
          </div>
        </div>
      </div>
    </div>

    <div class="dd-detail-cols">
      <div class="col-run">

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_agenda_label'); ?></div>
          <div class="bd">
            <?php if (!$agenda) { ?>
              <p class="dd-muted" style="font-size:13px"><?php echo _l('dd_none'); ?></p>
            <?php } else { ?>
              <ul class="dd-agenda">
                <?php foreach ($agenda as $item) { ?>
                  <li><?php echo html_escape(is_array($item) ? (isset($item['text']) ? $item['text'] : '') : $item); ?></li>
                <?php } ?>
              </ul>
            <?php } ?>
          </div>
        </div>

        <?php if ($visit->next_step || $visit->outcome_note) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_outcome'); ?></div>
            <div class="bd">
              <table class="dd-kv">
                <?php if ($visit->outcome) { ?>
                  <tr><td class="k"><?php echo _l('dd_outcome'); ?></td><td><?php echo html_escape($visit->outcome); ?></td></tr>
                <?php } ?>
                <?php if ($visit->next_step) { ?>
                  <tr><td class="k"><?php echo _l('dd_q_next_step'); ?></td><td><?php echo html_escape($visit->next_step); ?></td></tr>
                <?php } ?>
                <?php if ($visit->next_at) { ?>
                  <tr><td class="k"><?php echo _l('dd_next_follow_up'); ?></td><td><?php echo _dt($visit->next_at); ?></td></tr>
                <?php } ?>
                <?php if ($visit->outcome_note) { ?>
                  <tr><td class="k"><?php echo _l('dd_note'); ?></td><td><?php echo html_escape($visit->outcome_note); ?></td></tr>
                <?php } ?>
              </table>
            </div>
          </div>
        <?php } ?>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_open_requests'); ?></div>
          <div class="bd flush">
            <div class="table-responsive">
              <table class="dd-table">
                <thead>
                  <tr>
                    <th><?php echo _l('dd_ref'); ?></th>
                    <th><?php echo _l('dd_type'); ?></th>
                    <th><?php echo _l('dd_status'); ?></th>
                    <th><?php echo _l('dd_due'); ?></th>
                  </tr>
                </thead>
                <tbody>
                  <?php if (!$requests) { ?>
                    <tr><td colspan="4" class="text-center dd-muted" style="padding:24px">
                      <?php echo _l('dd_no_requests'); ?>
                    </td></tr>
                  <?php } ?>
                  <?php foreach ($requests as $r) { ?>
                    <tr>
                      <td>
                        <span class="dd-pill <?php echo dd_priority_class($r->priority); ?>">
                          <?php echo dd_priority_label($r->priority); ?>
                        </span>
                        <a href="<?php echo admin_url('dealer_desk/request/' . $r->id); ?>" class="dd-ref">
                          <?php echo html_escape($r->ref_no); ?>
                        </a>
                      </td>
                      <td><?php echo html_escape($r->type_name); ?></td>
                      <td><span class="dd-pill dd-pill-muted"><?php echo dd_status_label($r->status); ?></span></td>
                      <td><?php echo $r->due_at ? _d($r->due_at) : '—'; ?></td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      <div class="col-context">
        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_timeline'); ?></div>
          <div class="bd">
            <ul class="dd-timeline">
              <?php foreach ($timeline as $entry) { ?>
                <li class="<?php echo $entry->actor_staff_id ? '' : 'sys'; ?>">
                  <span class="meta">
                    <?php echo _dt($entry->created_at); ?> ·
                    <?php echo $entry->actor_staff_id ? html_escape(dd_staff_name($entry->actor_staff_id)) : 'System'; ?>
                  </span>
                  <?php echo html_escape($entry->summary); ?>
                </li>
              <?php } ?>
              <?php if (!$timeline) { ?>
                <li class="dd-muted"><?php echo _l('dd_none'); ?></li>
              <?php } ?>
            </ul>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
