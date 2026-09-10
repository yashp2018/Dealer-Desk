<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php $wa = dd_whatsapp_link($dealer->whatsapp_phone ?: $dealer->phone_primary); ?>
<div id="wrapper">
  <div class="content">

    <div class="dd-panel">
      <div class="hd">
        <strong style="font-size:14px"><?php echo html_escape($dealer->display_name); ?></strong>
        <span class="dd-ref"><?php echo html_escape($dealer->dealer_code); ?></span>
        <?php if ($dealer->tier_name) { ?>
          <span class="dd-pill" style="background:<?php echo html_escape($dealer->tier_color); ?>1a;color:<?php echo html_escape($dealer->tier_color); ?>">
            <?php echo html_escape($dealer->tier_name); ?>
          </span>
        <?php } ?>
        <span class="right">
          <a href="<?php echo admin_url('dealer_desk/new_request?dealer=' . $dealer->id); ?>" class="btn btn-primary btn-xs">
            <i class="fa fa-plus"></i> <?php echo _l('dd_new_request'); ?>
          </a>
          <?php if ($dealer->client_id) { ?>
            <a href="<?php echo admin_url('clients/client/' . $dealer->client_id); ?>" class="btn btn-default btn-xs">
              <?php echo _l('customer'); ?>
            </a>
          <?php } ?>
        </span>
      </div>
    </div>

    <div class="row">
      <div class="col-md-4">

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_dealer'); ?></div>
          <div class="bd">
            <form action="<?php echo admin_url('dealer_desk/update_dealer/' . $dealer->id); ?>" method="post">
<?php echo dd_csrf_field(); ?>
              <div class="form-group">
                <label style="font-size:12px"><?php echo _l('dd_dealer'); ?></label>
                <input type="text" name="display_name" class="form-control input-sm" value="<?php echo html_escape($dealer->display_name); ?>">
              </div>
              <div class="row">
                <div class="col-xs-6 form-group">
                  <label style="font-size:12px"><?php echo _l('dd_call'); ?></label>
                  <input type="text" name="phone_primary" class="form-control input-sm" value="<?php echo html_escape($dealer->phone_primary); ?>">
                </div>
                <div class="col-xs-6 form-group">
                  <label style="font-size:12px"><?php echo _l('dd_whatsapp'); ?></label>
                  <input type="text" name="whatsapp_phone" class="form-control input-sm" value="<?php echo html_escape($dealer->whatsapp_phone); ?>">
                </div>
              </div>
              <div class="row">
                <div class="col-xs-6 form-group">
                  <label style="font-size:12px">City</label>
                  <input type="text" name="city" class="form-control input-sm" value="<?php echo html_escape($dealer->city); ?>">
                </div>
                <div class="col-xs-6 form-group">
                  <label style="font-size:12px">State</label>
                  <input type="text" name="state_normalized" class="form-control input-sm" value="<?php echo html_escape($dealer->state_normalized); ?>">
                </div>
              </div>
              <div class="form-group">
                <label style="font-size:12px"><?php echo _l('dd_tier'); ?></label>
                <select name="tier_id" class="form-control input-sm">
                  <?php foreach ($tiers as $tier) { ?>
                    <option value="<?php echo $tier->id; ?>" <?php echo (int) $dealer->tier_id === (int) $tier->id ? 'selected' : ''; ?>>
                      <?php echo html_escape($tier->name); ?>
                    </option>
                  <?php } ?>
                </select>
              </div>
              <div class="form-group">
                <label style="font-size:12px"><?php echo _l('dd_territory'); ?></label>
                <select name="territory_id" class="form-control input-sm">
                  <option value=""><?php echo _l('dd_none'); ?></option>
                  <?php foreach ($territories as $territory) { ?>
                    <option value="<?php echo $territory->id; ?>" <?php echo (int) $dealer->territory_id === (int) $territory->id ? 'selected' : ''; ?>>
                      <?php echo html_escape($territory->name); ?>
                    </option>
                  <?php } ?>
                </select>
                <label style="font-weight:400;font-size:12px;margin-top:6px">
                  <input type="checkbox" name="territory_is_manual" value="1" <?php echo $dealer->territory_is_manual ? 'checked' : ''; ?>>
                  Pin against rule sweeps
                </label>
              </div>
              <div class="form-group">
                <label style="font-size:12px"><?php echo _l('dd_owner'); ?></label>
                <select name="owner_staff_id" class="form-control input-sm">
                  <option value=""><?php echo _l('dd_unassigned'); ?></option>
                  <?php foreach ($staff as $member) { ?>
                    <option value="<?php echo $member->staffid; ?>" <?php echo (int) $dealer->owner_staff_id === (int) $member->staffid ? 'selected' : ''; ?>>
                      <?php echo html_escape($member->name); ?>
                    </option>
                  <?php } ?>
                </select>
              </div>
              <button class="btn btn-primary btn-sm btn-block"><?php echo _l('dd_save'); ?></button>
            </form>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_health'); ?></div>
          <div class="bd">
            <div style="font-size:34px;font-weight:700;line-height:1">
              <?php echo $dealer->health_score === null ? '—' : (int) $dealer->health_score; ?>
              <span class="dd-muted" style="font-size:14px">/100</span>
            </div>
            <table class="dd-kv" style="margin-top:10px">
              <tr><td class="k"><?php echo _l('dd_open_requests'); ?></td><td><?php echo (int) $dealer->open_requests; ?></td></tr>
              <tr><td class="k"><?php echo _l('dd_overdue_requests'); ?></td><td><?php echo (int) $dealer->overdue_requests; ?></td></tr>
              <tr><td class="k"><?php echo _l('dd_last_contact'); ?></td><td><?php echo dd_relative_time($dealer->last_contact_at); ?></td></tr>
            </table>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd">
            <?php echo _l('dd_contacts'); ?>
            <span class="right"><?php echo count($contacts); ?></span>
          </div>
          <div class="bd">
            <?php if (!$contacts) { ?>
              <p class="dd-muted" style="font-size:13px"><?php echo _l('dd_no_contacts'); ?></p>
            <?php } ?>
            <?php foreach ($contacts as $contact) { ?>
              <div style="padding:7px 0;border-bottom:1px solid var(--dd-rule-soft)">
                <strong><?php echo html_escape($contact->name); ?></strong>
                <?php if ($contact->is_primary) { ?><span class="dd-pill dd-pill-ok">1st</span><?php } ?>
                <div class="dd-muted" style="font-size:12px">
                  <?php echo html_escape($contact->role_label); ?>
                  <?php if ($contact->phone) { ?> · <a href="tel:<?php echo html_escape($contact->phone); ?>"><?php echo html_escape($contact->phone); ?></a><?php } ?>
                </div>
              </div>
            <?php } ?>

            <form action="<?php echo admin_url('dealer_desk/add_contact/' . $dealer->id); ?>" method="post" style="margin-top:12px">
<?php echo dd_csrf_field(); ?>
              <div class="row">
                <div class="col-xs-6 form-group">
                  <input type="text" name="name" class="form-control input-sm" placeholder="<?php echo _l('dd_contact_name'); ?>" required>
                </div>
                <div class="col-xs-6 form-group">
                  <input type="text" name="role_label" class="form-control input-sm" placeholder="<?php echo _l('dd_contact_role'); ?>">
                </div>
              </div>
              <div class="form-group">
                <input type="text" name="phone" class="form-control input-sm" placeholder="<?php echo _l('dd_call'); ?>">
              </div>
              <button class="btn btn-default btn-sm btn-block"><?php echo _l('dd_add_contact'); ?></button>
            </form>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_requests'); ?></div>
          <div class="bd flush">
            <div class="table-responsive">
              <table class="dd-table">
                <thead>
                  <tr><th><?php echo _l('dd_ref'); ?></th><th><?php echo _l('dd_type'); ?></th>
                      <th><?php echo _l('dd_status'); ?></th><th><?php echo _l('dd_due'); ?></th></tr>
                </thead>
                <tbody>
                  <?php if (!$requests) { ?>
                    <tr><td colspan="4" class="text-center dd-muted" style="padding:22px"><?php echo _l('dd_no_requests'); ?></td></tr>
                  <?php } ?>
                  <?php foreach ($requests as $request) { ?>
                    <tr>
                      <td>
                        <span class="dd-pill <?php echo dd_priority_class($request->priority); ?>"><?php echo dd_priority_label($request->priority); ?></span>
                        <a href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>" class="dd-ref"><?php echo html_escape($request->ref_no); ?></a>
                      </td>
                      <td>
                        <?php echo html_escape($request->type_name); ?>
                        <?php if ($request->title) { ?><div class="dd-muted" style="font-size:11.5px"><?php echo html_escape($request->title); ?></div><?php } ?>
                      </td>
                      <td><span class="dd-pill dd-pill-muted"><?php echo dd_status_label($request->status); ?></span></td>
                      <td class="dd-muted"><?php echo $request->due_at ? _d($request->due_at) : '—'; ?></td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <?php if ($visits) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_visits'); ?></div>
            <div class="bd flush">
              <table class="dd-table">
                <tbody>
                  <?php foreach ($visits as $visit) { ?>
                    <tr>
                      <td class="dd-ref"><?php echo html_escape($visit->ref_no); ?></td>
                      <td><?php echo html_escape($visit->title); ?></td>
                      <td class="dd-muted"><?php echo _dt($visit->scheduled_at); ?></td>
                      <td><span class="dd-pill dd-pill-muted"><?php echo html_escape($visit->status); ?></span></td>
                      <td><?php echo $visit->outcome ? strtoupper($visit->outcome) : ''; ?></td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        <?php } ?>

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
              <?php if (!$timeline) { ?><li class="dd-muted"><?php echo _l('dd_no_requests'); ?></li><?php } ?>
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
