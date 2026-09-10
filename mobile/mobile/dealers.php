<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <div class="d" style="font-size:15px"><?php echo _l('dd_dealers'); ?></div>
      </div>

      <input type="text" class="dd-search" id="dd-filter"
             placeholder="<?php echo _l('dd_search_dealer'); ?>" autocomplete="off">

      <div class="dd-list" id="dd-dealer-rows">
        <?php foreach ($dealers as $dealer) { ?>
          <a class="row-d" href="<?php echo admin_url('dealer_desk/m_dealer/' . $dealer->id); ?>"
             data-search="<?php echo html_escape(strtolower($dealer->display_name . ' ' . $dealer->city . ' ' . $dealer->dealer_code)); ?>">
            <span>
              <span class="nm"><?php echo html_escape($dealer->display_name); ?></span>
              <span class="ct"><?php echo html_escape($dealer->city); ?><?php echo $dealer->dealer_code ? ' · ' . html_escape($dealer->dealer_code) : ''; ?></span>
            </span>
            <span class="rt">
              <?php if ($dealer->overdue_requests > 0) { ?>
                <span class="dd-pill dd-p1"><?php echo (int) $dealer->overdue_requests; ?></span>
              <?php } elseif ($dealer->open_requests > 0) { ?>
                <span class="dd-pill dd-pill-muted"><?php echo (int) $dealer->open_requests; ?></span>
              <?php } ?>
            </span>
          </a>
        <?php } ?>
      </div>

      <?php if (!$dealers) { ?>
        <div class="dd-empty">
          <p><?php echo _l('dd_no_requests'); ?></p>
          <?php if (dd_can('configure')) { ?>
            <a href="<?php echo admin_url('dealer_desk/import'); ?>" class="dd-btn grey sm">
              <?php echo _l('dd_setup_import'); ?>
            </a>
          <?php } ?>
        </div>
      <?php } ?>

    </div>

    <?php $this->load->view('dealer_desk/mobile/_tabbar', ['active' => 'dealers']); ?>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
<script>
(function () {
  'use strict';

  var input = document.getElementById('dd-filter');
  var rows  = document.querySelectorAll('#dd-dealer-rows .row-d');

  // Local filtering only. The picker must never wait on the network.
  input.addEventListener('input', function () {
    var q = input.value.trim().toLowerCase();

    for (var i = 0; i < rows.length; i++) {
      rows[i].style.display = (q === '' || rows[i].getAttribute('data-search').indexOf(q) !== -1) ? 'flex' : 'none';
    }
  });
}());
</script>
</body>
</html>
