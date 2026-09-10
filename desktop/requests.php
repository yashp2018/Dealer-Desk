<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<div id="wrapper">
  <div class="content">
    <div class="dd-panel">
      <div class="hd">
        <?php echo _l('dd_requests'); ?>
        <span class="right">
          <a href="<?php echo admin_url('dealer_desk/new_request'); ?>" class="btn btn-primary btn-xs">
            <i class="fa fa-plus"></i> <?php echo _l('dd_new_request'); ?>
          </a>
        </span>
      </div>
      <div class="bd">
        <form method="get" action="<?php echo admin_url('dealer_desk/requests'); ?>" class="row" data-dd-noays>
          <div class="col-md-4">
            <input type="text" name="q" class="form-control input-sm"
                   value="<?php echo html_escape($this->input->get('q')); ?>"
                   placeholder="<?php echo _l('dd_search'); ?>">
          </div>
          <div class="col-md-2">
            <select name="type_id" class="form-control input-sm">
              <option value=""><?php echo _l('dd_all_types'); ?></option>
              <?php foreach ($types as $type) { ?>
                <option value="<?php echo $type->id; ?>" <?php echo (int) $this->input->get('type_id') === (int) $type->id ? 'selected' : ''; ?>>
                  <?php echo html_escape($type->name); ?>
                </option>
              <?php } ?>
            </select>
          </div>
          <div class="col-md-2">
            <select name="priority" class="form-control input-sm">
              <option value=""><?php echo _l('dd_priority'); ?></option>
              <?php foreach ([1, 2, 3] as $p) { ?>
                <option value="<?php echo $p; ?>" <?php echo (int) $this->input->get('priority') === $p ? 'selected' : ''; ?>>
                  <?php echo dd_priority_label($p); ?>
                </option>
              <?php } ?>
            </select>
          </div>
          <div class="col-md-2">
            <?php $status = $this->input->get('status') ?: ''; ?>
            <select name="status" class="form-control input-sm">
              <option value=""><?php echo _l('dd_open_only'); ?></option>
              <option value="all" <?php echo $status === 'all' ? 'selected' : ''; ?>>
                <?php echo _l('dd_all_statuses'); ?>
              </option>
              <?php foreach (dd_statuses() as $key => $label) { ?>
                <option value="<?php echo $key; ?>" <?php echo $status === $key ? 'selected' : ''; ?>>
                  <?php echo $label; ?>
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
                <th><?php echo _l('dd_ref'); ?></th>
                <th><?php echo _l('dd_dealer'); ?></th>
                <th><?php echo _l('dd_type'); ?></th>
                <th><?php echo _l('dd_status'); ?></th>
                <th><?php echo _l('dd_owner'); ?></th>
                <th><?php echo _l('dd_due'); ?></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <?php if (!$requests) { ?>
                <tr><td colspan="7" class="text-center dd-muted" style="padding:28px"><?php echo _l('dd_no_requests'); ?></td></tr>
              <?php } ?>
              <?php foreach ($requests as $request) {
                  $late = !empty($request->due_at) && strtotime($request->due_at) < time() && dd_is_open_status($request->status);
              ?>
                <tr>
                  <td>
                    <span class="dd-pill <?php echo dd_priority_class($request->priority); ?>"><?php echo dd_priority_label($request->priority); ?></span>
                    <a href="<?php echo admin_url('dealer_desk/request/' . $request->id); ?>" class="dd-ref"><?php echo html_escape($request->ref_no); ?></a>
                  </td>
                  <td>
                    <span class="dealer"><?php echo html_escape($request->dealer_name); ?></span>
                    <div class="dd-muted" style="font-size:11.5px"><?php echo html_escape($request->dealer_city); ?></div>
                  </td>
                  <td>
                    <?php echo html_escape($request->type_name); ?>
                    <?php if ($request->title) { ?><div class="dd-muted" style="font-size:11.5px"><?php echo html_escape($request->title); ?></div><?php } ?>
                  </td>
                  <td><span class="dd-pill dd-pill-muted"><?php echo dd_status_label($request->status); ?></span></td>
                  <td><?php echo html_escape(dd_staff_name($request->owner_staff_id)); ?></td>
                  <td>
                    <?php if ($late) { ?>
                      <?php $od = dd_overdue_days($request->due_at); ?>
                      <span class="dd-late"><?php echo $od <= 1 ? _l('dd_day_late') : _l('dd_days_late', $od); ?></span>
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
</div>
<?php init_tail(); ?>
</body>
</html>
