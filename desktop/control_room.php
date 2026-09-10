<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">

    <div class="row">
      <div class="col-md-12">
        <div class="dd-stats">
          <div class="stat is-p1">
            <div class="n"><?php echo (int) $stats['breached']; ?></div>
            <div class="l"><?php echo _l('dd_breached'); ?></div>
          </div>
          <div class="stat is-p2">
            <div class="n"><?php echo (int) $stats['due_today']; ?></div>
            <div class="l"><?php echo _l('dd_due_today_count'); ?></div>
          </div>
          <div class="stat">
            <div class="n"><?php echo (int) $stats['open']; ?></div>
            <div class="l"><?php echo _l('dd_open'); ?></div>
          </div>
          <div class="stat">
            <div class="n"><?php echo (int) $stats['waiting']; ?></div>
            <div class="l"><?php echo _l('dd_waiting'); ?></div>
          </div>
          <div class="stat is-ok">
            <div class="n"><?php echo (int) $stats['done_this_week']; ?></div>
            <div class="l"><?php echo _l('dd_done_this_week'); ?></div>
          </div>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-md-8">
        <div class="dd-panel">
          <div class="hd">
            <?php echo _l('dd_live_queue'); ?>
            <span class="right">
              <span class="dd-views">
                <?php
                  $views = [
                      'mine'       => _l('dd_view_mine'),
                      'breached'   => _l('dd_view_breached'),
                      'unassigned' => _l('dd_view_unassigned'),
                      'all'        => _l('dd_view_all'),
                  ];
                  foreach ($views as $key => $label) { ?>
                  <a href="<?php echo admin_url('dealer_desk?view=' . $key); ?>"
                     class="<?php echo $active_view === $key ? 'active' : ''; ?>"><?php echo $label; ?></a>
                <?php } ?>
              </span>
            </span>
          </div>
          <div class="bd flush">
            <div class="table-responsive">
              <table class="dd-table">
                <thead>
                  <tr>
                    <th><?php echo _l('dd_ref'); ?></th>
                    <th><?php echo _l('dd_dealer'); ?></th>
                    <th><?php echo _l('dd_type'); ?></th>
                    <th><?php echo _l('dd_owner'); ?></th>
                    <th><?php echo _l('dd_due'); ?></th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <?php if (!$requests) { ?>
                    <tr><td colspan="6" class="text-center dd-muted" style="padding:28px"><?php echo _l('dd_no_requests'); ?></td></tr>
                  <?php } ?>
                  <?php foreach ($requests as $request) {
                      $late = !empty($request->due_at) && strtotime($request->due_at) < time();
                      $days = $late ? dd_overdue_days($request->due_at) : 0;
                  ?>
                    <tr>
                      <td>
                        <span class="dd-pill <?php echo dd_priority_class($request->priority); ?>">
                          <?php echo dd_priority_label($request->priority); ?>
                        </span>
                        <a href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>" class="dd-ref">
                          <?php echo html_escape($request->ref_no); ?>
                        </a>
                      </td>
                      <td>
                        <a href="<?php echo $request->dealer_id ? admin_url('dealer_desk/dealer/' . $request->dealer_id) : '#'; ?>" class="dealer">
                          <?php echo html_escape($request->dealer_name); ?>
                        </a>
                        <div class="dd-muted" style="font-size:11.5px"><?php echo html_escape($request->dealer_city); ?></div>
                      </td>
                      <td>
                        <?php if ($request->type_icon) { ?><i class="fa <?php echo html_escape($request->type_icon); ?>"></i> <?php } ?>
                        <?php echo html_escape($request->type_name); ?>
                        <?php if ($request->title) { ?>
                          <div class="dd-muted" style="font-size:11.5px"><?php echo html_escape($request->title); ?></div>
                        <?php } ?>
                      </td>
                      <td><?php echo html_escape(dd_staff_name($request->owner_staff_id)); ?></td>
                      <td>
                        <?php if ($late) { ?>
                          <span class="dd-late"><?php echo $days <= 1 ? _l('dd_day_late') : _l('dd_days_late', $days); ?></span>
                        <?php } elseif ($request->due_at) { ?>
                          <span class="dd-muted"><?php echo _d($request->due_at); ?></span>
                        <?php } ?>
                      </td>
                      <td>
                        <?php if ($request->completion_required > 0) { ?>
                          <span class="dd-progress <?php echo $request->completion_done >= $request->completion_required ? 'complete' : ''; ?>">
                            <span class="bar">
                              <?php for ($i = 0; $i < $request->completion_required; $i++) { ?>
                                <span class="seg <?php echo $i < $request->completion_done ? 'on' : ''; ?>"></span>
                              <?php } ?>
                            </span>
                          </span>
                        <?php } ?>
                      </td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-4">
        <?php // The right rail turns "look at everything" into a short list of decisions. ?>
        <div class="dd-panel">
          <div class="hd"><i class="fa fa-exclamation-triangle"></i> <?php echo _l('dd_needs_a_human'); ?></div>
          <div class="bd flush">
            <ul class="dd-attention">
              <li class="<?php echo $attention['unassigned'] ? '' : 'zero'; ?>">
                <span class="n"><?php echo (int) $attention['unassigned']; ?></span>
                <a href="<?php echo admin_url('dealer_desk?view=unassigned'); ?>"><?php echo _l('dd_view_unassigned'); ?></a>
              </li>
              <li class="<?php echo $attention['unscheduled'] ? '' : 'zero'; ?>">
                <span class="n"><?php echo (int) $attention['unscheduled']; ?></span>
                <a href="<?php echo admin_url('dealer_desk/calendar'); ?>"><?php echo _l('dd_unscheduled'); ?></a>
              </li>
              <li class="<?php echo $attention['incomplete'] ? '' : 'zero'; ?>">
                <span class="n"><?php echo (int) $attention['incomplete']; ?></span>
                <span><?php echo _l('dd_incomplete_details'); ?> &gt; 48h</span>
              </li>
              <li class="<?php echo $attention['breached'] ? '' : 'zero'; ?>">
                <span class="n"><?php echo (int) $attention['breached']; ?></span>
                <a href="<?php echo admin_url('dealer_desk?view=breached'); ?>"><?php echo _l('dd_breached'); ?></a>
              </li>
            </ul>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_team_load'); ?></div>
          <div class="bd flush">
            <div class="dd-load">
              <?php
                $peak = 1;
                foreach ($team as $member) { $peak = max($peak, (int) $member->open_count); }
                if (!$team) { ?>
                  <div style="padding:14px" class="dd-muted"><?php echo _l('dd_no_requests'); ?></div>
                <?php }
                foreach ($team as $member) {
                    $pct = round(((int) $member->open_count / $peak) * 100);
              ?>
                <div class="row-load">
                  <span class="name"><?php echo html_escape($member->name); ?></span>
                  <span class="track"><span class="fill" style="width:<?php echo $pct; ?>%"></span></span>
                  <span class="n"><?php echo (int) $member->open_count; ?></span>
                  <?php if ((int) $member->open_count === 0) { ?>
                    <span class="free">← <?php echo _l('dd_free'); ?></span>
                  <?php } ?>
                </div>
              <?php } ?>
            </div>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_capture'); ?></div>
          <div class="bd">
            <a href="<?php echo admin_url('dealer_desk/new_request'); ?>" class="btn btn-primary btn-block">
              <i class="fa fa-plus"></i> <?php echo _l('dd_new_request'); ?>
            </a>
            <a href="<?php echo admin_url('dealer_desk/calendar'); ?>" class="btn btn-default btn-block">
              <i class="fa fa-calendar"></i> <?php echo _l('dd_calendar_board'); ?>
            </a>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
