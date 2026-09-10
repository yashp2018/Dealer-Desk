<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M7 — Week strip.
 *
 * Seven columns of load dots, no text. It answers only "which day is
 * packed?" and then hands off to the day rail.
 */
$max = 1;
foreach ($days as $day) {
    $max = max($max, $day['total'] + $day['visits']);
}
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m_week?from=' . date('Y-m-d', strtotime($from . ' -7 days'))); ?>"
           class="btn btn-default btn-sm"><i class="fa fa-chevron-left"></i></a>
        <div class="d" style="font-size:15px">
          <?php echo date('j M', strtotime($from)); ?> – <?php echo date('j M', strtotime($from . ' +6 days')); ?>
        </div>
        <div class="sp"></div>
        <a href="<?php echo admin_url('dealer_desk/m_week?from=' . date('Y-m-d', strtotime($from . ' +7 days'))); ?>"
           class="btn btn-default btn-sm"><i class="fa fa-chevron-right"></i></a>
      </div>

      <div class="dd-weekstrip">
        <?php foreach ($days as $day) {
            $count = $day['total'] + $day['visits'];
            // Cap the dots so a heavy day stays readable rather than overflowing.
            $dots  = min($count, 8);
        ?>
          <a href="<?php echo admin_url('dealer_desk/m?date=' . $day['date']); ?>"
             class="<?php echo $day['date'] === date('Y-m-d') ? 'today' : ''; ?>">
            <div class="dw"><?php echo $day['label']; ?></div>
            <div class="dn"><?php echo $day['day']; ?></div>
            <div class="dots">
              <?php for ($i = 0; $i < $dots; $i++) {
                  $class = 'dot';
                  if ($i < $day['visits']) {
                      $class .= ' v';
                  } elseif ($i < $day['visits'] + $day['p1']) {
                      $class .= ' p1';
                  }
              ?>
                <span class="<?php echo $class; ?>"></span>
              <?php } ?>
            </div>
            <div class="tot"><?php echo $count ?: ''; ?></div>
          </a>
        <?php } ?>
      </div>

      <div style="margin-top:20px;display:flex;gap:16px;justify-content:center;font-size:12px" class="dd-muted">
        <span><span class="dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--dd-new)"></span> <?php echo _l('dd_visits'); ?></span>
        <span><span class="dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--dd-p1)"></span> P1</span>
        <span><span class="dot" style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--dd-accent)"></span> <?php echo _l('dd_open'); ?></span>
      </div>

    </div>

    <a href="<?php echo admin_url('dealer_desk/m_capture'); ?>" class="dd-fab">+</a>
    <?php $this->load->view('dealer_desk/mobile/_tabbar', ['active' => 'week']); ?>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
</body>
</html>
