<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="dd-panel">
      <div class="hd">
        <?php echo _l('dd_dealers'); ?> (<?php echo count($dealers); ?>)
        <span class="right">
          <?php if (dd_can('configure')) { ?>
            <a href="<?php echo admin_url('dealer_desk/import'); ?>" class="btn btn-default btn-xs">
              <i class="fa fa-download"></i> <?php echo _l('dd_setup_import'); ?>
            </a>
            <a href="<?php echo admin_url('dealer_desk/gaps'); ?>" class="btn btn-default btn-xs">
              <?php echo _l('dd_setup_gaps'); ?>
            </a>
          <?php } ?>
        </span>
      </div>
      <div class="bd">
        <form method="get" action="<?php echo admin_url('dealer_desk/dealers'); ?>" class="row" data-dd-noays>
          <div class="col-md-5">
            <input type="text" name="q" class="form-control input-sm"
                   value="<?php echo html_escape($this->input->get('q')); ?>"
                   placeholder="<?php echo _l('dd_search_dealer'); ?>">
          </div>
          <div class="col-md-3">
            <select name="tier_id" class="form-control input-sm">
              <option value=""><?php echo _l('dd_tier'); ?></option>
              <?php foreach ($tiers as $tier) { ?>
                <option value="<?php echo $tier->id; ?>" <?php echo (int) $this->input->get('tier_id') === (int) $tier->id ? 'selected' : ''; ?>>
                  <?php echo html_escape($tier->name); ?>
                </option>
              <?php } ?>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-default btn-sm btn-block"><?php echo _l('dd_search'); ?></button>
          </div>
        </form>
      </div>
      <div class="bd flush">
        <div class="table-responsive">
          <table class="dd-table">
            <thead>
              <tr>
                <th><?php echo _l('dd_dealer_code'); ?></th>
                <th><?php echo _l('dd_dealer'); ?></th>
                <th><?php echo _l('dd_tier'); ?></th>
                <th><?php echo _l('dd_owner'); ?></th>
                <th><?php echo _l('dd_open_requests'); ?></th>
                <th><?php echo _l('dd_overdue_requests'); ?></th>
                <th><?php echo _l('dd_last_contact'); ?></th>
              </tr>
            </thead>
            <tbody>
              <?php if (!$dealers) { ?>
                <tr><td colspan="7" class="text-center dd-muted" style="padding:28px">
                  <?php echo _l('dd_no_requests'); ?>
                  <?php if (dd_can('configure')) { ?>
                    <br><a href="<?php echo admin_url('dealer_desk/import'); ?>"><?php echo _l('dd_setup_import'); ?></a>
                  <?php } ?>
                </td></tr>
              <?php } ?>
              <?php foreach ($dealers as $dealer) { ?>
                <tr>
                  <td class="dd-ref"><?php echo html_escape($dealer->dealer_code); ?></td>
                  <td>
                    <a href="<?php echo admin_url('dealer_desk/dealer/' . $dealer->id); ?>" class="dealer">
                      <?php echo html_escape($dealer->display_name); ?>
                    </a>
                    <div class="dd-muted" style="font-size:11.5px">
                      <?php echo html_escape(trim($dealer->city . ', ' . $dealer->state_normalized, ', ')); ?>
                    </div>
                  </td>
                  <td>
                    <?php if ($dealer->tier_name) { ?>
                      <span class="dd-pill" style="background:<?php echo html_escape($dealer->tier_color); ?>1a;color:<?php echo html_escape($dealer->tier_color); ?>">
                        <?php echo html_escape($dealer->tier_name); ?>
                      </span>
                    <?php } ?>
                  </td>
                  <td><?php echo html_escape(dd_staff_name($dealer->owner_staff_id)); ?></td>
                  <td><?php echo (int) $dealer->open_requests; ?></td>
                  <td>
                    <?php if ($dealer->overdue_requests > 0) { ?>
                      <span class="dd-late"><?php echo (int) $dealer->overdue_requests; ?></span>
                    <?php } else { echo '0'; } ?>
                  </td>
                  <td class="dd-muted"><?php echo dd_relative_time($dealer->last_contact_at); ?></td>
                </tr>
              <?php } ?>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
