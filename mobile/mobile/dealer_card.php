<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * M5 — Dealer card. The "phone is ringing" screen.
 *
 * Three numbers, because by the time the employee says hello they should
 * know whether this dealer is waiting on anything.
 */
$wa = dd_whatsapp_link($dealer->whatsapp_phone ?: $dealer->phone_primary);
?>
<div id="wrapper">
  <div class="content">
    <div class="dd-phone">
    <div class="dd-m">

      <div class="dd-m-top">
        <a href="<?php echo admin_url('dealer_desk/m_dealers'); ?>" class="btn btn-default btn-sm">
          <i class="fa fa-arrow-left"></i>
        </a>
        <div class="sp"></div>
        <?php if ($dealer->tier_name) { ?>
          <span class="dd-pill" style="background:<?php echo html_escape($dealer->tier_color); ?>1a;color:<?php echo html_escape($dealer->tier_color); ?>">
            <?php echo html_escape($dealer->tier_name); ?>
          </span>
        <?php } ?>
      </div>

      <div style="font-size:24px;font-weight:700;letter-spacing:-.02em;line-height:1.15">
        <?php echo html_escape($dealer->display_name); ?>
      </div>
      <div class="dd-muted" style="font-size:13px;margin-top:2px">
        <?php echo html_escape(trim($dealer->city . ', ' . $dealer->state_normalized, ', ')); ?>
        <?php if ($dealer->dealer_code) { ?> · <span class="dd-ref"><?php echo html_escape($dealer->dealer_code); ?></span><?php } ?>
      </div>

      <div class="dd-contact-row">
        <a class="call <?php echo $dealer->phone_primary ? '' : 'disabled'; ?>"
           href="tel:<?php echo html_escape($dealer->phone_primary); ?>">
          <i class="fa fa-phone"></i> <?php echo _l('dd_call'); ?>
        </a>
        <a class="wa <?php echo $wa ? '' : 'disabled'; ?>"
           href="<?php echo $wa ? html_escape($wa) : '#'; ?>" target="_blank" rel="noopener">
          <i class="fab fa-whatsapp"></i> <?php echo _l('dd_whatsapp'); ?>
        </a>
      </div>

      <?php // Three numbers only. Enough to hold the conversation. ?>
      <div class="dd-nums">
        <div>
          <div class="n"><?php echo (int) $dealer->open_requests; ?></div>
          <div class="l"><?php echo _l('dd_open_requests'); ?></div>
        </div>
        <div>
          <div class="n <?php echo $dealer->overdue_requests > 0 ? 'late' : ''; ?>">
            <?php echo (int) $dealer->overdue_requests; ?>
          </div>
          <div class="l"><?php echo _l('dd_overdue_requests'); ?></div>
        </div>
        <div>
          <div class="n" style="font-size:18px"><?php echo dd_relative_time($dealer->last_contact_at); ?></div>
          <div class="l"><?php echo _l('dd_last_contact'); ?></div>
        </div>
      </div>

      <?php if ($contacts) { ?>
        <div class="dd-sec"><?php echo _l('dd_contacts'); ?></div>
        <div class="dd-list">
          <?php foreach ($contacts as $contact) { ?>
            <a class="row-d" href="tel:<?php echo html_escape($contact->phone); ?>">
              <span>
                <span class="nm"><?php echo html_escape($contact->name); ?></span>
                <span class="ct"><?php echo html_escape($contact->role_label ?: ''); ?></span>
              </span>
              <span class="rt"><i class="fa fa-phone" style="color:var(--dd-ok)"></i></span>
            </a>
          <?php } ?>
        </div>
      <?php } else { ?>
        <div class="dd-sec"><?php echo _l('dd_contacts'); ?></div>
        <div class="dd-empty" style="padding:18px">
          <?php echo _l('dd_no_contacts'); ?>
          <div style="margin-top:10px">
            <a href="<?php echo admin_url('dealer_desk/dealer/' . $dealer->id); ?>" class="dd-btn grey sm">
              <?php echo _l('dd_add_contact'); ?>
            </a>
          </div>
        </div>
      <?php } ?>

      <div class="dd-sec"><?php echo _l('dd_open_requests'); ?></div>
      <?php if ($requests) { ?>
        <?php foreach ($requests as $request) {
            $this->load->view('dealer_desk/mobile/_request_item', ['request' => $request, 'show_late' => true, 'hide_dealer' => true]);
        } ?>
      <?php } else { ?>
        <div class="dd-empty" style="padding:18px"><?php echo _l('dd_no_requests'); ?></div>
      <?php } ?>

    </div>

    <div class="dd-sticky-foot">
      <a href="<?php echo admin_url('dealer_desk/m_capture?dealer=' . $dealer->id); ?>" class="dd-btn">
        + <?php echo _l('dd_new_request'); ?>
      </a>
    </div>
    <div class="dd-toast" id="dd-toast"></div>
    </div><!-- /.dd-phone -->
  </div>
</div>

<?php init_tail(); ?>
</body>
</html>
