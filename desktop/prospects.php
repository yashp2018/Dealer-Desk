<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * D5 - Prospect pipeline. Five columns, not twelve.
 * A prospect and a dealer look nearly identical to the employee, because
 * their day is genuinely mixed.
 */
$labels = dd_prospect_stages();
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-panel">
      <div class="hd">
        <?php echo _l('dd_pipeline'); ?>
        <span class="right">
          <a href="<?php echo admin_url('leads'); ?>" class="btn btn-default btn-xs"><?php echo _l('leads'); ?></a>
        </span>
      </div>
      <div class="bd">
        <div class="dd-pipeline">
          <?php foreach (array_merge($stages, $closed) as $stage) {
              $is_closed = in_array($stage, $closed, true);
          ?>
            <div class="stage <?php echo $is_closed ? 'is-closed' : ''; ?>">
              <div class="hd">
                <span><?php echo $labels[$stage]; ?></span>
                <span class="n"><?php echo count($board[$stage]); ?></span>
              </div>
              <div class="bd">
                <?php foreach ($board[$stage] as $prospect) { ?>
                  <a class="prospect" href="<?php echo admin_url('dealer_desk/prospect/' . $prospect->id); ?>">
                    <span class="co"><?php echo html_escape($prospect->company_name); ?></span>
                    <span class="dd-muted"><?php echo html_escape(trim($prospect->city . ', ' . $prospect->state_normalized, ', ')); ?></span>
                    <span class="dd-muted" style="display:block;font-size:11px;margin-top:3px">
                      <?php echo html_escape(dd_staff_name($prospect->owner_staff_id)); ?>
                      &middot; <?php echo dd_relative_time($prospect->stage_changed_at); ?>
                    </span>
                  </a>
                <?php } ?>
                <?php if (!$board[$stage]) { ?>
                  <p class="dd-muted" style="font-size:12px;text-align:center;padding:12px 0"><?php echo _l('dd_none'); ?></p>
                <?php } ?>
              </div>
            </div>
          <?php } ?>
        </div>
      </div>
    </div>
  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
