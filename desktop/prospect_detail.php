<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php $labels = dd_prospect_stages(); $wa = dd_whatsapp_link($prospect->whatsapp ?: $prospect->phone); ?>
<div id="wrapper">
  <div class="content">

    <div class="dd-panel">
      <div class="hd">
        <span class="dd-pill dd-pill-new"><?php echo _l('dd_prospect'); ?></span>
        <strong style="font-size:14px"><?php echo html_escape($prospect->company_name); ?></strong>
        <span class="dd-ref"><?php echo html_escape($prospect->ref_no); ?></span>
        <span class="right">
          <?php if ($prospect->converted_dealer_id) { ?>
            <a href="<?php echo admin_url('dealer_desk/dealer/' . $prospect->converted_dealer_id); ?>" class="btn btn-primary btn-xs">
              <?php echo _l('dd_dealer'); ?>
            </a>
          <?php } ?>
        </span>
      </div>
    </div>

    <div class="row">
      <div class="col-md-4">
        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_prospect'); ?></div>
          <div class="bd">
            <table class="dd-kv">
              <tr><td class="k"><?php echo _l('dd_contact_name'); ?></td><td><?php echo html_escape($prospect->contact_name); ?></td></tr>
              <tr><td class="k"><?php echo _l('dd_call'); ?></td>
                  <td><a href="tel:<?php echo html_escape($prospect->phone); ?>"><?php echo html_escape($prospect->phone); ?></a></td></tr>
              <tr><td class="k"><?php echo _l('dd_whatsapp'); ?></td>
                  <td><?php if ($wa) { ?><a href="<?php echo html_escape($wa); ?>" target="_blank" rel="noopener"><?php echo _l('dd_whatsapp'); ?></a><?php } ?></td></tr>
              <tr><td class="k">City</td><td><?php echo html_escape(trim($prospect->city . ', ' . $prospect->state_normalized, ', ')); ?></td></tr>
              <tr><td class="k"><?php echo _l('dd_owner'); ?></td><td><?php echo html_escape(dd_staff_name($prospect->owner_staff_id)); ?></td></tr>
              <tr><td class="k">Source</td><td><?php echo html_escape($prospect->source); ?></td></tr>
            </table>

            <form action="<?php echo admin_url('dealer_desk/set_stage/' . $prospect->id); ?>" method="post" style="margin-top:12px" data-dd-noays>
<?php echo dd_csrf_field(); ?>
              <label style="font-size:12px"><?php echo _l('dd_pipeline'); ?></label>
              <select name="stage" class="form-control input-sm" onchange="this.form.requestSubmit ? this.form.requestSubmit() : this.form.submit()">
                <?php foreach ($labels as $key => $label) { ?>
                  <option value="<?php echo $key; ?>" <?php echo $prospect->stage === $key ? 'selected' : ''; ?>>
                    <?php echo $label; ?>
                  </option>
                <?php } ?>
              </select>
            </form>

            <?php if ($prospect->stage === 'onboarding' && dd_can('convert')) { ?>
              <form action="<?php echo admin_url('dealer_desk/convert/' . $prospect->id); ?>" method="post" style="margin-top:12px">
<?php echo dd_csrf_field(); ?>
                <label style="font-size:12px"><?php echo _l('dd_tier'); ?></label>
                <select name="tier_id" class="form-control input-sm">
                  <?php foreach ($tiers as $tier) { ?>
                    <option value="<?php echo $tier->id; ?>" <?php echo $tier->is_default ? 'selected' : ''; ?>>
                      <?php echo html_escape($tier->name); ?>
                    </option>
                  <?php } ?>
                </select>
                <button class="btn btn-primary btn-sm btn-block" style="margin-top:8px">
                  <?php echo _l('dd_convert_to_dealer'); ?>
                </button>
              </form>
            <?php } ?>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_new_visit'); ?></div>
          <div class="bd">
            <form action="<?php echo admin_url('dealer_desk/create_visit'); ?>" method="post">
<?php echo dd_csrf_field(); ?>
              <?php echo form_hidden('prospect_id', $prospect->id); ?>
              <?php echo form_hidden('redirect', admin_url('dealer_desk/prospect/' . $prospect->id)); ?>
              <div class="form-group">
                <select name="visit_type_id" class="form-control input-sm">
                  <?php foreach ($visit_types as $vt) { ?>
                    <option value="<?php echo $vt->id; ?>"><?php echo html_escape($vt->name); ?></option>
                  <?php } ?>
                </select>
              </div>
              <div class="form-group">
                <input type="datetime-local" name="scheduled_at" class="form-control input-sm" required>
              </div>
              <button class="btn btn-default btn-sm btn-block"><?php echo _l('dd_new_visit'); ?></button>
            </form>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <?php if ($checklist) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_onboarding_checklist'); ?></div>
            <div class="bd flush">
              <table class="dd-table">
                <tbody>
                  <?php foreach ($checklist as $item) { ?>
                    <tr>
                      <td>
                        <?php echo html_escape($item->doc_name); ?>
                        <?php if ($item->is_required) { ?><span style="color:var(--dd-p1)">*</span><?php } ?>
                      </td>
                      <td style="width:220px">
                        <form action="<?php echo admin_url('dealer_desk/set_onboarding_item/' . $item->id); ?>" method="post" data-dd-noays>
<?php echo dd_csrf_field(); ?>
                          <?php echo form_hidden('redirect', admin_url('dealer_desk/prospect/' . $prospect->id)); ?>
                          <select name="status" class="form-control input-sm" onchange="this.form.requestSubmit ? this.form.requestSubmit() : this.form.submit()">
                            <?php foreach (['pending', 'received', 'verified', 'rejected'] as $st) { ?>
                              <option value="<?php echo $st; ?>" <?php echo $item->status === $st ? 'selected' : ''; ?>>
                                <?php echo _l('dd_doc_' . $st); ?>
                              </option>
                            <?php } ?>
                          </select>
                        </form>
                      </td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        <?php } ?>

        <?php if ($visits) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_visits'); ?></div>
            <div class="bd flush">
              <table class="dd-table">
                <tbody>
                  <?php foreach ($visits as $visit) { ?>
                    <tr>
                      <td><a href="<?php echo admin_url('dealer_desk/visit/' . $visit->id); ?>" class="dd-ref"><?php echo html_escape($visit->ref_no); ?></a></td>
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

        <?php if ($requests) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_requests'); ?></div>
            <div class="bd flush">
              <table class="dd-table">
                <tbody>
                  <?php foreach ($requests as $request) { ?>
                    <tr>
                      <td><a href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>" class="dd-ref"><?php echo html_escape($request->ref_no); ?></a></td>
                      <td><?php echo html_escape($request->type_name); ?></td>
                      <td><span class="dd-pill dd-pill-muted"><?php echo dd_status_label($request->status); ?></span></td>
                    </tr>
                  <?php } ?>
                </tbody>
              </table>
            </div>
          </div>
        <?php } ?>
      </div>
    </div>

  </div>
</div>
<?php init_tail(); ?>
</body>
</html>
