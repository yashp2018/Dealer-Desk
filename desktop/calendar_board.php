<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * D2 — Calendar Board.
 *
 * Staff swimlanes across a week, not a month grid. The manager's real
 * question is never "what happens on the 14th" but "is anyone drowning, and
 * is anyone free?" — swimlanes answer that at a glance.
 */
?>
<div id="wrapper">
  <div class="content">

    <div class="row">
      <div class="col-md-12">
        <div class="dd-panel">
          <div class="hd">
            <a href="<?php echo admin_url('dealer_desk/calendar?from=' . date('Y-m-d', strtotime($from . ' -7 days'))); ?>"
               class="btn btn-default btn-xs"><i class="fa fa-chevron-left"></i></a>
            <span><?php echo date('j M', strtotime($from)); ?> – <?php echo date('j M Y', strtotime($from . ' +6 days')); ?></span>
            <a href="<?php echo admin_url('dealer_desk/calendar?from=' . date('Y-m-d', strtotime($from . ' +7 days'))); ?>"
               class="btn btn-default btn-xs"><i class="fa fa-chevron-right"></i></a>
            <span class="right">
              <a href="<?php echo admin_url('dealer_desk/calendar'); ?>" class="btn btn-default btn-xs"><?php echo _l('dd_today'); ?></a>
            </span>
          </div>
          <div class="bd">
            <div class="dd-board-wrap" data-dd-board>

              <div class="dd-board">
                <table>
                  <thead>
                    <tr>
                      <th class="lane-h"><?php echo _l('dd_owner'); ?></th>
                      <?php foreach ($days as $day) { ?>
                        <th class="<?php echo $day === date('Y-m-d') ? 'today' : ''; ?>">
                          <?php echo date('D j', strtotime($day)); ?>
                        </th>
                      <?php } ?>
                    </tr>
                  </thead>
                  <tbody>
                    <?php if (!$grid) { ?>
                      <tr><td colspan="8" class="dd-muted" style="text-align:center;padding:26px">
                        <?php echo _l('dd_no_requests'); ?>
                      </td></tr>
                    <?php } ?>
                    <?php foreach ($grid as $staffId => $lane) { ?>
                      <tr>
                        <td class="lane"><?php echo html_escape($lane['name']); ?></td>
                        <?php foreach ($days as $day) {
                            $cell = $lane['days'][$day];
                        ?>
                          <td data-dd-cell data-date="<?php echo $day; ?>" data-staff="<?php echo $staffId; ?>">
                            <?php foreach ($cell['visits'] as $visit) { ?>
                              <a class="dd-card visit" href="<?php echo admin_url('dealer_desk/visit/' . $visit->id); ?>">
                                <span class="who"><i class="fa fa-industry"></i> <?php echo html_escape($visit->dealer_name); ?></span>
                                <span class="what"><?php echo date('H:i', strtotime($visit->scheduled_at)); ?> · <?php echo html_escape($visit->title); ?></span>
                              </a>
                            <?php } ?>
                            <?php foreach ($cell['requests'] as $request) { ?>
                              <a class="dd-card <?php echo dd_priority_class($request->priority); ?>"
                                 draggable="true" data-dd-card
                                 data-id="<?php echo $request->id; ?>"
                                 data-owner="<?php echo (int) $request->owner_staff_id; ?>"
                                 href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>">
                                <span class="who"><?php echo html_escape($request->dealer_name); ?></span>
                                <span class="what"><?php echo html_escape($request->type_name); ?></span>
                              </a>
                            <?php } ?>
                          </td>
                        <?php } ?>
                      </tr>
                    <?php } ?>
                  </tbody>
                </table>
              </div>

              <div class="dd-tray">
                <div class="dd-panel" style="margin:0">
                  <div class="hd"><?php echo _l('dd_unscheduled'); ?> (<?php echo count($unscheduled); ?>)</div>
                  <div class="bd">
                    <?php if (!$unscheduled) { ?>
                      <div class="dd-muted" style="font-size:13px"><?php echo _l('dd_no_requests'); ?></div>
                    <?php } ?>
                    <?php foreach ($unscheduled as $request) { ?>
                      <a class="dd-card <?php echo dd_priority_class($request->priority); ?>"
                         draggable="true" data-dd-card
                         data-id="<?php echo $request->id; ?>"
                         data-owner="<?php echo (int) $request->owner_staff_id; ?>"
                         href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>">
                        <span class="who"><?php echo html_escape($request->dealer_name); ?></span>
                        <span class="what"><?php echo html_escape($request->type_name); ?> · <?php echo html_escape(dd_staff_name($request->owner_staff_id)); ?></span>
                      </a>
                    <?php } ?>
                    <?php if ($unscheduled) { ?>
                      <p class="dd-muted" style="font-size:11.5px;margin-top:10px">
                        <?php echo _l('dd_drag_to_schedule'); ?>
                      </p>
                    <?php } ?>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
