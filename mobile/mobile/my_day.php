<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m" data-dd-myday>

      <div class="dd-m-top">
        <div>
          <div class="d"><?php echo date('l j M', strtotime($date)); ?></div>
          <div class="dd-eyebrow"><?php echo dd_staff_name(get_staff_user_id()); ?></div>
        </div>
        <div class="sp"></div>
        <a href="<?php echo admin_url('dealer_desk/m_dealers'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-search"></i>
        </a>
      </div>

      <?php
        // Three counters. The only question on arrival: am I behind?
        $chips = [
            ['overdue', _l('dd_overdue'), (int) $counters->overdue_count, 'is-p1'],
            ['',        _l('dd_today'),   (int) $counters->today_count,   'is-today'],
            ['waiting', _l('dd_waiting'), (int) $counters->waiting_count, 'is-wait'],
        ];
      ?>
      <div class="dd-counters">
        <?php foreach ($chips as $chip) { ?>
          <a href="<?php echo admin_url('dealer_desk/m' . ($chip[0] ? '?filter=' . $chip[0] : '')); ?>"
             class="<?php echo $chip[3]; ?> <?php echo ($filter === $chip[0] || (!$filter && $chip[0] === '')) ? 'active' : ''; ?>">
            <span class="n"><?php echo $chip[2]; ?></span>
            <span class="l"><?php echo $chip[1]; ?></span>
          </a>
        <?php } ?>
      </div>

      <?php
        // Split the rail: overdue first, then the timed day with a now-line.
        $overdue    = [];
        $unschedule = [];
        $scheduled  = [];

        foreach ($requests as $request) {
            if (!empty($request->due_at) && strtotime($request->due_at) < time()) {
                $overdue[] = $request;
            } elseif (empty($request->scheduled_at)) {
                $unschedule[] = $request;
            } else {
                $scheduled[] = $request;
            }
        }

        // Visits and scheduled requests share one timeline, ordered by clock.
        $timed = [];
        foreach ($scheduled as $request) {
            $timed[] = ['at' => strtotime($request->scheduled_at), 'kind' => 'request', 'row' => $request];
        }
        foreach ($visits as $visit) {
            $timed[] = ['at' => strtotime($visit->scheduled_at), 'kind' => 'visit', 'row' => $visit];
        }
        usort($timed, function ($a, $b) { return $a['at'] <=> $b['at']; });

        $nowDrawn = false;
        $isToday  = ($date === date('Y-m-d'));
      ?>

      <?php if ($overdue) { ?>
        <div class="dd-sec late"><?php echo _l('dd_overdue'); ?></div>
        <?php foreach ($overdue as $request) {
            $this->load->view('dealer_desk/mobile/_request_item', ['request' => $request, 'show_late' => true]);
        } ?>
      <?php } ?>

      <?php if ($timed) { ?>
        <?php foreach ($timed as $entry) { ?>
          <?php if ($isToday && !$nowDrawn && $entry['at'] > time()) { $nowDrawn = true; ?>
            <div class="dd-now"><?php echo _l('dd_now'); ?></div>
          <?php } ?>

          <div class="dd-time-label"><?php echo date('H:i', $entry['at']); ?></div>

          <?php if ($entry['kind'] === 'visit') { $visit = $entry['row']; ?>
            <a href="<?php echo admin_url('dealer_desk/m_visit/' . $visit->id); ?>" class="dd-item visit">
              <span class="who">
                <?php echo html_escape($visit->dealer_name); ?>
                <?php if ($visit->dealer_city) { ?><span class="city"><?php echo html_escape($visit->dealer_city); ?></span><?php } ?>
              </span>
              <span class="what">
                <i class="fa fa-industry"></i>
                <?php echo html_escape($visit->title); ?>
                <?php if ($visit->is_prospect) { ?><span class="dd-pill dd-pill-new"><?php echo _l('dd_prospect'); ?></span><?php } ?>
              </span>
              <?php if ($visit->status === 'planned') { ?>
                <span class="dd-inline-action"><i class="fa fa-play"></i> <?php echo _l('dd_start_visit'); ?></span>
              <?php } elseif ($visit->status === 'in_progress') { ?>
                <span class="dd-inline-action"><?php echo _l('dd_visit_in_progress'); ?></span>
              <?php } ?>
            </a>
          <?php } else {
              $this->load->view('dealer_desk/mobile/_request_item', ['request' => $entry['row'], 'show_late' => false]);
          } ?>
        <?php } ?>

        <?php if ($isToday && !$nowDrawn) { ?>
          <div class="dd-now"><?php echo _l('dd_now'); ?></div>
        <?php } ?>
      <?php } ?>

      <?php if ($unschedule) { ?>
        <div class="dd-sec"><?php echo _l('dd_unscheduled'); ?></div>
        <?php foreach ($unschedule as $request) {
            $this->load->view('dealer_desk/mobile/_request_item', ['request' => $request, 'show_late' => false]);
        } ?>
      <?php } ?>

      <?php if (!$overdue && !$timed && !$unschedule) { ?>
        <div class="dd-empty">
          <i class="fa fa-check-circle fa-2x" style="color:var(--dd-ok)"></i>
          <p style="margin-top:10px"><?php echo _l('dd_nothing_today'); ?></p>
        </div>
      <?php } ?>

      <?php if (!$filter) { ?>
        <div style="text-align:center;margin-top:22px">
          <a href="<?php echo admin_url('dealer_desk/m?date=' . date('Y-m-d', strtotime($date . ' +1 day'))); ?>"
             class="dd-btn grey sm">
            <?php echo _l('dd_pull_tomorrow'); ?> <i class="fa fa-arrow-right"></i>
          </a>
        </div>
      <?php } ?>

    </div>

    <a href="<?php echo admin_url('dealer_desk/m_capture'); ?>" class="dd-fab" title="<?php echo _l('dd_new_request'); ?>">+</a>
    <?php $this->load->view('dealer_desk/mobile/_tabbar', ['active' => 'day']); ?>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
</body>
</html>
