<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php init_head(); ?>
<?php
/**
 * D3 — Request detail, desktop.
 *
 * A request is not a bag of fields; it is a sequence. It gets captured,
 * owned and scheduled, its required details filled, turned into an ERP
 * document, and closed. The page is laid out in that order and every
 * section states where it sits in the run.
 *
 * Nothing here decides its own rules. dd_request_steps() owns the
 * lifecycle and dd_request_editable() owns write access, so the button
 * you can see and the action the controller will accept never disagree.
 */
$policy   = isset($policy) ? $policy : dd_request_policy($request, $type, $links);
$steps    = dd_request_steps($request, $type, $links, $policy);
$editable = $policy['handling']['allowed'];
$open     = $policy['open'];

$required = (int) $request->completion_required;
$filled   = (int) $request->completion_done;
$complete = $required === 0 || $filled >= $required;

$late = !empty($request->due_at) && strtotime($request->due_at) < time() && $open;
$days = $late ? dd_overdue_days($request->due_at) : 0;

$state_labels = [
    'done'    => _l('dd_done_label'),
    'current' => _l('dd_in_progress_label'),
    'locked'  => _l('dd_locked'),
    'skipped' => _l('dd_not_applicable'),
];

/** One section header: number, label, and the state chip that governs it. */
function dd_step_head($step, $labels)
{
    echo '<div class="hd">';
    echo '<span class="dd-stepno is-' . $step['state'] . '">' . $step['n'] . '</span>';
    echo '<span class="dd-steplabel">' . html_escape($step['label']) . '</span>';
    echo '<span class="right"><span class="dd-state is-' . $step['state'] . '">'
        . html_escape($labels[$step['state']]) . '</span></span>';
    echo '</div>';
}
?>
<div id="wrapper">
  <div class="content">

    <!-- ===================== Identity ===================== -->
    <div class="dd-reqhead">
      <div class="lead">
        <div class="ref">
          <span class="dd-pill <?php echo dd_priority_class($request->priority); ?>">
            <?php echo dd_priority_label($request->priority); ?>
          </span>
          <span class="dd-ref"><?php echo html_escape($request->ref_no); ?></span>
        </div>
        <h1>
          <?php if ($dealer) { ?>
            <a href="<?php echo admin_url('dealer_desk/dealer/' . $dealer->id); ?>">
              <?php echo html_escape($dealer->display_name); ?>
            </a>
          <?php } else { ?>
            <?php echo html_escape($request->dealer_name); ?>
            <span class="dd-pill dd-pill-new"><?php echo _l('dd_prospect'); ?></span>
          <?php } ?>
        </h1>
        <div class="sub">
          <?php if ($request->type_icon) { ?>
            <i class="fa <?php echo html_escape($request->type_icon); ?>"></i>
          <?php } ?>
          <?php echo html_escape($request->type_name); ?>
          <?php if ($request->title) { ?>
            <span class="dd-muted">· <?php echo html_escape($request->title); ?></span>
          <?php } ?>
        </div>
      </div>

      <div class="facts">
        <div class="fact">
          <div class="l"><?php echo _l('dd_status'); ?></div>
          <div class="v"><span class="dd-pill <?php echo $open ? 'dd-pill-new' : 'dd-pill-muted'; ?>">
            <?php echo dd_status_label($request->status); ?></span></div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_owner'); ?></div>
          <div class="v"><?php echo $request->owner_staff_id
              ? html_escape(dd_staff_name($request->owner_staff_id))
              : '<span class="dd-muted">' . _l('dd_unassigned') . '</span>'; ?></div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_due'); ?></div>
          <div class="v">
            <?php echo $request->due_at ? _dt($request->due_at) : '<span class="dd-muted">—</span>'; ?>
            <?php if ($late) { ?>
              <div class="dd-late"><?php echo $days <= 1 ? _l('dd_day_late') : _l('dd_days_late', $days); ?></div>
            <?php } ?>
          </div>
        </div>
        <div class="fact">
          <div class="l"><?php echo _l('dd_checklist'); ?></div>
          <div class="v">
            <?php if ($required === 0) { ?>
              <span class="dd-muted"><?php echo _l('dd_none'); ?></span>
            <?php } else { ?>
              <span class="dd-progress <?php echo $complete ? 'complete' : ''; ?>">
                <span class="bar">
                  <?php for ($i = 0; $i < $required; $i++) { ?>
                    <span class="seg <?php echo $i < $filled ? 'on' : ''; ?>"></span>
                  <?php } ?>
                </span>
                <?php echo _l('dd_details_progress', [$filled, $required]); ?>
              </span>
            <?php } ?>
          </div>
        </div>
      </div>
    </div>

    <!-- ===================== Progress rail ===================== -->
    <ol class="dd-rail">
      <?php foreach ($steps as $step) { ?>
        <li class="is-<?php echo $step['state']; ?>">
          <span class="mark"><?php echo $step['state'] === 'done' ? '&#10003;' : $step['n']; ?></span>
          <span class="txt">
            <span class="t"><?php echo html_escape($step['label']); ?></span>
            <span class="d"><?php echo html_escape($step['detail']); ?></span>
          </span>
        </li>
      <?php } ?>
    </ol>

    <div class="dd-detail-cols">

      <!-- ===================== The run ===================== -->
      <div class="col-run">

        <?php /* ---------- 2. Owner and schedule ---------- */ ?>
        <div class="dd-panel dd-run-step is-<?php echo $steps['assign']['state']; ?>">
          <?php dd_step_head($steps['assign'], $state_labels); ?>
          <div class="bd">
            <?php if (!$policy['handling']['allowed']) { ?>
              <p class="dd-locknote"><?php echo html_escape($policy['handling']['why']); ?></p>
            <?php } ?>

            <form action="<?php echo admin_url('dealer_desk/save_handling/' . $request->id); ?>"
                  method="post" data-dd-noays data-dd-dirty-hint>
<?php echo dd_csrf_field(); ?>
              <div class="dd-fieldrow">
                <div class="f">
                  <label><?php echo _l('dd_owner'); ?></label>
                  <select name="owner_staff_id" class="form-control input-sm"
                          <?php echo ($editable && dd_can('assign')) ? '' : 'disabled'; ?>>
                    <option value=""><?php echo _l('dd_unassigned'); ?></option>
                    <?php foreach ($staff as $member) { ?>
                      <option value="<?php echo (int) $member->staffid; ?>"
                        <?php echo (int) $request->owner_staff_id === (int) $member->staffid ? 'selected' : ''; ?>>
                        <?php echo html_escape($member->name); ?>
                      </option>
                    <?php } ?>
                  </select>
                </div>

                <div class="f">
                  <label><?php echo _l('dd_schedule'); ?></label>
                  <input type="datetime-local" name="scheduled_at" class="form-control input-sm"
                         value="<?php echo $request->scheduled_at
                             ? date('Y-m-d\TH:i', strtotime($request->scheduled_at)) : ''; ?>"
                         <?php echo $editable ? '' : 'disabled'; ?>>
                </div>

                <div class="f">
                  <label><?php echo _l('dd_priority'); ?></label>
                  <select name="priority" class="form-control input-sm" <?php echo $editable ? '' : 'disabled'; ?>>
                    <?php foreach ([1, 2, 3] as $p) { ?>
                      <option value="<?php echo $p; ?>"
                        <?php echo (int) $request->priority === $p ? 'selected' : ''; ?>>
                        <?php echo dd_priority_label($p); ?>
                      </option>
                    <?php } ?>
                  </select>
                </div>
              </div>

              <div class="dd-reason">
                <?php echo html_escape($request->priority_reason ?: _l('dd_priority_auto')); ?>
                <?php if ($request->priority_override !== null) { ?>
                  <span class="dd-pill dd-pill-muted">manual</span>
                <?php } ?>
              </div>

              <?php if ($editable) { ?>
                <div class="dd-actions">
                  <button type="submit" class="btn btn-primary btn-sm"><?php echo _l('dd_save_handling'); ?></button>
                  <span class="dd-unsaved" hidden><?php echo _l('dd_unsaved'); ?></span>
                  <?php if ($request->priority_override !== null) { ?>
                    <button type="submit" name="reset_priority" value="1" class="btn btn-default btn-sm">
                      <?php echo _l('dd_reset_to_auto'); ?>
                    </button>
                  <?php } ?>
                </div>
              <?php } ?>
            </form>
          </div>
        </div>

        <?php /* ---------- 3. Items ---------- */ ?>
        <?php if ($line_fields) { ?>
          <div class="dd-panel dd-run-step is-<?php echo $steps['details']['state']; ?>">
            <div class="hd">
              <span class="dd-stepno is-<?php echo $steps['details']['state']; ?>">3</span>
              <span class="dd-steplabel"><?php echo _l('dd_lines'); ?></span>
              <span class="right">
                <span class="dd-state is-<?php echo $steps['details']['state']; ?>">
                  <?php echo html_escape($state_labels[$steps['details']['state']]); ?>
                </span>
              </span>
            </div>
            <div class="bd">
              <?php if (!$policy['lines']['allowed']) { ?>
                <p class="dd-locknote"><?php echo html_escape($policy['lines']['why']); ?></p>
              <?php } ?>

              <form action="<?php echo admin_url('dealer_desk/save_lines/' . $request->id); ?>"
                    method="post" data-dd-noays data-dd-dirty-hint id="dd-lines-form"
                    data-search-url="<?php echo admin_url('dealer_desk/item_search'); ?>"
                    data-type-id="<?php echo (int) $request->type_id; ?>"
                    data-item-field="<?php echo html_escape((string) $line_keys['item']); ?>">
<?php echo dd_csrf_field(); ?>
                <?php echo form_hidden('redirect', 1); ?>

                <?php
                  // The line-scoped attributes beyond item and quantity —
                  // colour on an Order, serial number on a Warranty.
                  $line_attrs = [];
                  foreach ($line_fields as $lf) {
                      if (in_array($lf->field_key, ['model', 'part', 'item', 'what', 'quantity'], true)) {
                          continue;
                      }
                      $line_attrs[] = $lf;
                  }
                  $item_options = isset($field_options[$line_keys['item']])
                      ? $field_options[$line_keys['item']] : [];
                  $editable_lines = $policy['lines']['allowed'];

                  // A request that has no items yet still needs a row for Add
                  // to clone, so one renderer serves both the grid and the
                  // blank template below it. Two copies of this markup would
                  // drift, which is exactly why Add used to reload instead.
                  $render_line = function ($i, $line) use ($line_attrs, $item_options, $field_options, $editable_lines) {
                ?>
                        <tr data-dd-line>
                          <td class="n"><span class="dd-lineno"><?php echo $i + 1; ?></span></td>
                          <td class="dd-itemcell">
                            <?php /*
                              Typing here searches the whole catalogue rather
                              than a dropdown holding the first few hundred
                              items. Picking a suggestion links the line to the
                              catalogue row; typing and picking nothing leaves
                              item_id empty, which is what a free-text line has
                              always been.
                            */ ?>
                            <?php if ($item_options) { ?>
                              <input type="hidden" name="lines[<?php echo $i; ?>][item_id]"
                                     class="dd-line-item"
                                     value="<?php echo $line->item_id ? (int) $line->item_id : ''; ?>">
                            <?php } ?>
                            <input type="text" name="lines[<?php echo $i; ?>][description]"
                                   class="form-control input-sm dd-line-desc"
                                   value="<?php echo html_escape($line->description); ?>"
                                   autocomplete="off"
                                   <?php if ($item_options) { ?>
                                     data-catalogue="1"
                                     placeholder="<?php echo _l('dd_line_item_search'); ?>"
                                   <?php } ?>
                                   <?php echo $editable_lines ? '' : 'disabled'; ?>>
                            <?php if ($item_options) { ?>
                              <div class="dd-ac" hidden></div>
                              <span class="dd-ac-tag" <?php echo $line->item_id ? '' : 'hidden'; ?>>
                                <?php echo _l('dd_from_catalogue'); ?>
                              </span>
                            <?php } ?>
                          </td>
                          <?php foreach ($line_attrs as $lf) {
                              $val = isset($line->attrs[$lf->field_key]) ? $line->attrs[$lf->field_key] : '';
                              $nm  = 'lines[' . $i . '][attrs][' . html_escape($lf->field_key) . ']';
                          ?>
                            <td>
                              <?php if (in_array($lf->input_type, ['select', 'item_ref'], true)) { ?>
                                <select name="<?php echo $nm; ?>" class="form-control input-sm"
                                        <?php echo $editable_lines ? '' : 'disabled'; ?>>
                                  <option value="">—</option>
                                  <?php foreach ((isset($field_options[$lf->field_key]) ? $field_options[$lf->field_key] : []) as $o) { ?>
                                    <option value="<?php echo html_escape($o['value']); ?>"
                                      <?php echo (string) $val === (string) $o['value'] ? 'selected' : ''; ?>>
                                      <?php echo html_escape($o['label']); ?>
                                    </option>
                                  <?php } ?>
                                </select>
                              <?php } elseif ($lf->input_type === 'date') { ?>
                                <input type="date" name="<?php echo $nm; ?>" class="form-control input-sm"
                                       value="<?php echo html_escape($val); ?>" <?php echo $editable_lines ? '' : 'disabled'; ?>>
                              <?php } elseif (in_array($lf->input_type, ['number', 'money'], true)) { ?>
                                <input type="number" step="any" name="<?php echo $nm; ?>" class="form-control input-sm"
                                       value="<?php echo html_escape($val); ?>" <?php echo $editable_lines ? '' : 'disabled'; ?>>
                              <?php } else { ?>
                                <input type="text" name="<?php echo $nm; ?>" class="form-control input-sm"
                                       value="<?php echo html_escape($val); ?>" <?php echo $editable_lines ? '' : 'disabled'; ?>>
                              <?php } ?>
                            </td>
                          <?php } ?>
                          <td class="q">
                            <input type="number" step="any" min="0" name="lines[<?php echo $i; ?>][qty]"
                                   class="form-control input-sm dd-line-qty"
                                   value="<?php echo rtrim(rtrim(number_format((float) $line->qty, 3, '.', ''), '0'), '.'); ?>"
                                   <?php echo $editable_lines ? '' : 'disabled'; ?>>
                          </td>
                          <td class="r">
                            <input type="number" step="0.01" min="0" name="lines[<?php echo $i; ?>][unit_rate]"
                                   class="form-control input-sm dd-line-rate"
                                   value="<?php echo $line->unit_rate === null ? '' : html_escape($line->unit_rate); ?>"
                                   <?php echo $editable_lines ? '' : 'disabled'; ?>>
                          </td>
                          <td class="a"><span class="dd-line-amount">—</span></td>
                          <?php if ($editable_lines) { ?>
                            <td class="x">
                              <button type="button" class="dd-line-remove" title="<?php echo _l('dd_remove_line'); ?>"
                                      aria-label="<?php echo _l('dd_remove_line'); ?>">&times;</button>
                            </td>
                          <?php } ?>
                        </tr>
                <?php
                  };

                  $blank_line = (object) [
                      'item_id'     => null,
                      'description' => '',
                      'qty'         => 1,
                      'unit_rate'   => null,
                      'attrs'       => [],
                      'note'        => null,
                  ];
                ?>

                <?php if ($item_options) { ?>
                  <?php /*
                    The opening page of the catalogue, emitted once for the
                    whole grid rather than once per row. Focusing an item
                    field offers these straight away — which is the whole
                    list for a short one such as the vehicle models — and
                    typing goes past them to search_items() on the server.
                  */ ?>
                  <script type="application/json" id="dd-line-head"><?php
                      echo json_encode(array_map(function ($o) {
                          return [
                              'value' => $o['value'],
                              'label' => $o['label'],
                              'rate'  => isset($o['rate']) ? $o['rate'] : null,
                          ];
                      }, array_slice($item_options, 0, 50)));
                  ?></script>
                <?php } ?>

                <div class="table-responsive">
                  <table class="dd-linetable" id="dd-lines">
                    <thead>
                      <tr>
                        <th class="n"><?php echo _l('dd_line_no'); ?></th>
                        <th><?php echo _l('dd_line_item'); ?></th>
                        <?php foreach ($line_attrs as $lf) { ?>
                          <th><?php echo html_escape($lf->label); ?></th>
                        <?php } ?>
                        <th class="q"><?php echo _l('dd_line_qty'); ?></th>
                        <th class="r"><?php echo _l('dd_line_rate'); ?></th>
                        <th class="a"><?php echo _l('dd_line_amount'); ?></th>
                        <?php if ($editable_lines) { ?><th class="x"></th><?php } ?>
                      </tr>
                    </thead>
                    <tbody>
                      <?php foreach ($lines as $i => $line) { $render_line($i, $line); } ?>
                    </tbody>
                    <?php if ($editable_lines) { ?>
                      <?php /* Inert: template content is not submitted and not
                               matched by the grid's selectors. Add clones it. */ ?>
                      <template id="dd-line-template"><?php $render_line(0, $blank_line); ?></template>
                    <?php } ?>
                    <tfoot>
                      <tr>
                        <td colspan="<?php echo 3 + count($line_attrs); ?>"></td>
                        <td class="r"><?php echo _l('dd_lines_total'); ?></td>
                        <td class="a"><strong id="dd-lines-total">—</strong></td>
                        <?php if ($editable_lines) { ?><td></td><?php } ?>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <?php /* Always present so the grid can hide and show it as
                         rows are added and removed, not only on first paint. */ ?>
                <p class="dd-hint" id="dd-lines-empty" <?php echo $lines ? 'hidden' : ''; ?>>
                  <?php echo _l('dd_no_lines'); ?>
                </p>

                <?php if ($editable_lines) { ?>
                  <div class="dd-actions">
                    <button type="button" class="btn btn-default btn-sm" id="dd-add-line">
                      <i class="fa fa-plus"></i> <?php echo _l('dd_add_line'); ?>
                    </button>
                    <button type="submit" class="btn btn-primary btn-sm"><?php echo _l('dd_save_items'); ?></button>
                    <span class="dd-unsaved" hidden><?php echo _l('dd_unsaved'); ?></span>
                  </div>
                <?php } ?>
              </form>
            </div>
          </div>
        <?php } ?>

        <?php /* ---------- 3b. Header details ---------- */ ?>
        <?php if ($fields) { ?>
          <div class="dd-panel dd-run-step is-<?php echo $steps['details']['state']; ?>">
            <div class="hd">
              <span class="dd-stepno is-<?php echo $steps['details']['state']; ?>"><?php echo $line_fields ? '3b' : '3'; ?></span>
              <span class="dd-steplabel"><?php echo _l('dd_step_details'); ?></span>
              <span class="right">
                <span class="dd-state is-<?php echo $steps['details']['state']; ?>">
                  <?php echo html_escape($state_labels[$steps['details']['state']]); ?>
                </span>
              </span>
            </div>
            <div class="bd">
              <?php if (!$policy['details']['allowed']) { ?>
                <p class="dd-locknote"><?php echo html_escape($policy['details']['why']); ?></p>
              <?php } ?>

              <form action="<?php echo admin_url('dealer_desk/save_details/' . $request->id); ?>"
                    method="post" data-dd-noays data-dd-dirty-hint>
<?php echo dd_csrf_field(); ?>
                <?php echo form_hidden('redirect', 1); ?>
                <div class="dd-fieldrow">
                  <?php foreach ($fields as $field) {
                      $value   = isset($details[$field->field_key]) ? $details[$field->field_key] : null;
                      $current = '';
                      if ($value) {
                          if ($field->input_type === 'item_ref') { $current = $value->value_ref; }
                          elseif (in_array($field->input_type, ['number', 'money', 'toggle'], true)) { $current = $value->value_num; }
                          elseif ($field->input_type === 'date') { $current = $value->value_date; }
                          else { $current = $value->value_text; }
                      }
                      $name = 'fields[' . html_escape($field->field_key) . ']';
                      $dis  = $policy['details']['allowed'] ? '' : 'disabled';
                  ?>
                    <div class="f <?php echo in_array($field->input_type, ['textarea', 'photo'], true) ? 'wide' : ''; ?>">
                      <label>
                        <?php echo html_escape($field->label); ?>
                        <?php if ($field->is_required) { ?><span class="req">*</span><?php } ?>
                      </label>

                      <?php if (in_array($field->input_type, ['select', 'item_ref'], true)) { ?>
                        <select name="<?php echo $name; ?>" class="form-control input-sm" <?php echo $dis; ?>>
                          <option value=""><?php echo _l('dd_none'); ?></option>
                          <?php foreach ((isset($field_options[$field->field_key]) ? $field_options[$field->field_key] : []) as $option) { ?>
                            <option value="<?php echo html_escape($option['value']); ?>"
                              <?php echo ((string) $current === (string) $option['value']) ? 'selected' : ''; ?>>
                              <?php echo html_escape($option['label']); ?>
                            </option>
                          <?php } ?>
                        </select>

                      <?php } elseif ($field->input_type === 'textarea') { ?>
                        <textarea name="<?php echo $name; ?>" class="form-control input-sm" rows="2"
                                  <?php echo $dis; ?>><?php echo html_escape($current); ?></textarea>

                      <?php } elseif ($field->input_type === 'photo') { ?>
                        <?php // A photo requirement is satisfied by an attachment on the
                              // request, never by typing into a text box. ?>
                        <div class="dd-photofield">
                          <?php if ($attachments) { ?>
                            <span class="dd-pill dd-pill-ok">
                              <i class="fa fa-paperclip"></i>
                              <?php echo count($attachments); ?>
                            </span>
                          <?php } else { ?>
                            <span class="dd-hint"><?php echo _l('dd_attach_photo_hint'); ?></span>
                          <?php } ?>
                          <input type="hidden" name="<?php echo $name; ?>"
                                 value="<?php echo $attachments ? 'attached' : ''; ?>">
                        </div>

                      <?php } elseif ($field->input_type === 'date') { ?>
                        <input type="date" name="<?php echo $name; ?>" class="form-control input-sm"
                               value="<?php echo html_escape($current); ?>" <?php echo $dis; ?>>

                      <?php } elseif (in_array($field->input_type, ['number', 'money'], true)) { ?>
                        <input type="number" step="<?php echo $field->input_type === 'money' ? '0.01' : '1'; ?>"
                               <?php echo $field->min_value !== null ? 'min="' . html_escape($field->min_value) . '"' : ''; ?>
                               <?php echo $field->max_value !== null ? 'max="' . html_escape($field->max_value) . '"' : ''; ?>
                               name="<?php echo $name; ?>" class="form-control input-sm"
                               value="<?php echo html_escape($current); ?>" <?php echo $dis; ?>>

                      <?php } else { ?>
                        <input type="text" name="<?php echo $name; ?>" class="form-control input-sm"
                               value="<?php echo html_escape($current); ?>" <?php echo $dis; ?>>
                      <?php } ?>

                      <?php if (!empty($field->help_text)) { ?>
                        <p class="dd-hint"><?php echo html_escape($field->help_text); ?></p>
                      <?php } ?>
                    </div>
                  <?php } ?>
                </div>

                <?php if ($policy['details']['allowed']) { ?>
                  <div class="dd-actions">
                    <button type="submit" class="btn btn-primary btn-sm"><?php echo _l('dd_save_details'); ?></button>
                    <span class="dd-unsaved" hidden><?php echo _l('dd_unsaved'); ?></span>
                    <span class="dd-hint"><?php echo _l('dd_details_progress', [$filled, $required]); ?></span>
                  </div>
                <?php } ?>
              </form>
            </div>
          </div>
        <?php } ?>

        <?php /* ---------- 4. Create the ERP record ---------- */ ?>
        <div class="dd-panel dd-run-step is-<?php echo $steps['push']['state']; ?>">
          <?php dd_step_head($steps['push'], $state_labels); ?>
          <div class="bd">
            <?php
              $live       = [];
              $superseded = [];
              foreach ($links as $link) {
                  if ($link->superseded_at) { $superseded[] = $link; } else { $live[] = $link; }
              }
            ?>

            <?php if ($live) { ?>
              <?php foreach ($live as $link) { ?>
                <div class="dd-linkrow">
                  <span class="ent"><?php echo html_escape(dd_push_target_label($link->target_entity)); ?></span>
                  <?php if ($link->target_entity === 'estimate') { ?>
                    <a href="<?php echo admin_url('estimates/list_estimates/' . $link->target_id); ?>" class="ref">
                      <?php echo html_escape($link->target_ref); ?>
                    </a>
                  <?php } else { ?>
                    <span class="ref"><?php echo html_escape($link->target_ref); ?></span>
                  <?php } ?>
                  <span class="dd-pill <?php echo $policy['doc_state'] === 'accepted' ? 'dd-pill-ok' : 'dd-pill-muted'; ?>">
                    <?php echo html_escape($link->last_status ?: dd_doc_state_label($policy['doc_state'])); ?>
                  </span>
                  <?php if ((int) $link->revision > 1) { ?>
                    <span class="dd-pill dd-pill-muted">r<?php echo (int) $link->revision; ?></span>
                  <?php } ?>
                  <span class="dd-muted when"><?php echo _dt($link->pushed_at); ?></span>
                </div>
              <?php } ?>

              <?php if ($policy['doc_state'] === 'missing') { ?>
                <p class="dd-locknote"><?php echo _l('dd_doc_missing_warning'); ?></p>
              <?php } ?>

              <?php if ($policy['revise']['allowed']) { ?>
                <form action="<?php echo admin_url('dealer_desk/revise/' . $request->id); ?>"
                      method="post" data-dd-noays class="dd-revise">
<?php echo dd_csrf_field(); ?>
                  <p class="dd-hint"><?php echo _l('dd_revise_hint'); ?></p>
                  <div class="dd-fieldrow">
                    <div class="f wide">
                      <label><?php echo _l('dd_revise_reason'); ?> <span class="req">*</span></label>
                      <input type="text" name="reason" class="form-control input-sm" required
                             placeholder="<?php echo _l('dd_revise_reason'); ?>">
                    </div>
                  </div>
                  <div class="dd-actions">
                    <button type="submit" class="btn btn-default btn-sm"><?php echo _l('dd_revise'); ?></button>
                  </div>
                </form>
              <?php } elseif ($policy['revise']['why']) { ?>
                <p class="dd-locknote"><?php echo html_escape($policy['revise']['why']); ?></p>
              <?php } ?>

            <?php } elseif ($policy['push']['allowed']) { ?>
              <p class="dd-hint">
                <?php echo _l('dd_push_ready_hint', dd_push_target_label($type->push_target)); ?>
              </p>
              <form action="<?php echo admin_url('dealer_desk/push_to_erp/' . $request->id); ?>"
                    method="post" data-dd-noays>
<?php echo dd_csrf_field(); ?>
                <button type="submit" class="btn btn-primary btn-sm">
                  <?php echo _l('dd_push_to', dd_push_target_label($type->push_target)); ?> &rarr;
                </button>
              </form>

            <?php } else { ?>
              <p class="dd-locknote"><?php echo html_escape($policy['push']['why']); ?></p>
              <?php if (!$complete && $required > 0 && $policy['open']) { ?>
                <p class="dd-hint"><?php echo _l('dd_push_unlock_hint', [$required - $filled]); ?></p>
              <?php } ?>
            <?php } ?>

            <?php if ($superseded) { ?>
              <div class="dd-superseded">
                <div class="dd-eyebrow"><?php echo _l('dd_doc_state_void'); ?></div>
                <?php foreach ($superseded as $link) { ?>
                  <div class="dd-linkrow muted">
                    <span class="ent"><?php echo html_escape(dd_push_target_label($link->target_entity)); ?></span>
                    <?php if ($link->target_entity === 'estimate') { ?>
                      <a href="<?php echo admin_url('estimates/list_estimates/' . $link->target_id); ?>" class="ref">
                        <?php echo html_escape($link->target_ref); ?>
                      </a>
                    <?php } else { ?>
                      <span class="ref"><?php echo html_escape($link->target_ref); ?></span>
                    <?php } ?>
                    <span class="dd-pill dd-pill-muted">r<?php echo (int) $link->revision; ?></span>
                    <span class="dd-muted when"><?php echo _dt($link->superseded_at); ?></span>
                  </div>
                <?php } ?>
              </div>
            <?php } ?>
          </div>
        </div>

        <?php /* ---------- 5. Close ---------- */ ?>
        <div class="dd-panel dd-run-step is-<?php echo $steps['close']['state']; ?>">
          <?php dd_step_head($steps['close'], $state_labels); ?>
          <div class="bd">
            <?php if (!$policy['open']) { ?>
              <p class="dd-locknote">
                <?php echo _l('dd_closed_on', [dd_status_label($request->status), _dt($request->done_at)]); ?>
              </p>
              <?php if ($request->closed_reason) { ?>
                <table class="dd-kv">
                  <tr>
                    <td class="k"><?php echo _l('dd_closed_reason'); ?></td>
                    <td><?php echo html_escape($request->closed_reason); ?></td>
                  </tr>
                </table>
              <?php } ?>

              <?php if ($policy['reopen']['allowed']) { ?>
                <form action="<?php echo admin_url('dealer_desk/reopen/' . $request->id); ?>"
                      method="post" data-dd-noays>
<?php echo dd_csrf_field(); ?>
                  <div class="dd-actions">
                    <button type="submit" class="btn btn-default btn-sm"><?php echo _l('dd_reopen'); ?></button>
                  </div>
                </form>
              <?php } ?>

            <?php } elseif (!$policy['close']['allowed']) { ?>
              <p class="dd-locknote"><?php echo html_escape($policy['close']['why']); ?></p>

            <?php } else { ?>
              <form action="<?php echo admin_url('dealer_desk/set_status/' . $request->id); ?>"
                    method="post" data-dd-noays>
<?php echo dd_csrf_field(); ?>
                <?php echo form_hidden('redirect', 1); ?>
                <div class="dd-fieldrow">
                  <div class="f">
                    <label><?php echo _l('dd_status'); ?></label>
                    <select name="status" class="form-control input-sm">
                      <option value="<?php echo html_escape($request->status); ?>">
                        <?php echo dd_status_label($request->status); ?>
                      </option>
                      <?php foreach (dd_allowed_transitions($request->status) as $next) { ?>
                        <option value="<?php echo $next; ?>"><?php echo dd_status_label($next); ?></option>
                      <?php } ?>
                    </select>
                  </div>
                  <?php if (!$complete && $required > 0) { ?>
                    <div class="f wide">
                      <label><?php echo _l('dd_closed_reason'); ?> <span class="req">*</span></label>
                      <input type="text" name="reason" class="form-control input-sm"
                             placeholder="<?php echo _l('dd_err_reason_required'); ?>">
                    </div>
                  <?php } ?>
                </div>
                <div class="dd-actions">
                  <button type="submit" class="btn btn-primary btn-sm"><?php echo _l('dd_close_request'); ?></button>
                </div>
              </form>
            <?php } ?>
          </div>
        </div>

      </div>

      <!-- ===================== Context ===================== -->
      <div class="col-context">

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_timeline'); ?></div>
          <div class="bd">
            <?php if (dd_can('edit')) { ?>
              <form action="<?php echo admin_url('dealer_desk/add_note/' . $request->id); ?>"
                    method="post" data-dd-noays style="margin-bottom:16px">
<?php echo dd_csrf_field(); ?>
                <?php echo form_hidden('redirect', 1); ?>
                <div class="input-group">
                  <input type="text" name="body" class="form-control input-sm"
                         placeholder="<?php echo _l('dd_add_note'); ?>">
                  <span class="input-group-btn">
                    <button class="btn btn-default btn-sm" type="submit"><?php echo _l('dd_save'); ?></button>
                  </span>
                </div>
              </form>
            <?php } ?>

            <ul class="dd-timeline">
              <?php foreach ($timeline as $entry) { ?>
                <li class="<?php echo $entry->actor_staff_id ? '' : 'sys'; ?> <?php echo $entry->event_type === 'pushed' ? 'push' : ''; ?>">
                  <span class="meta">
                    <?php echo _dt($entry->created_at); ?> ·
                    <?php echo $entry->actor_staff_id ? html_escape(dd_staff_name($entry->actor_staff_id)) : 'System'; ?>
                  </span>
                  <?php echo html_escape($entry->summary); ?>
                </li>
              <?php } ?>
              <?php if (!$timeline) { ?>
                <li class="dd-muted"><?php echo _l('dd_none'); ?></li>
              <?php } ?>
            </ul>
          </div>
        </div>

        <div class="dd-panel">
          <div class="hd"><?php echo _l('dd_attachments'); ?></div>
          <div class="bd">
            <?php if (!$attachments) { ?>
              <p class="dd-muted" style="font-size:13px"><?php echo _l('dd_no_attachments'); ?></p>
            <?php } ?>
            <?php foreach ($attachments as $file) { ?>
              <?php if ($file->kind === 'voice') { ?>
                <audio controls preload="none" style="width:100%;margin-bottom:8px"
                       src="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>"></audio>
              <?php } else { ?>
                <a href="<?php echo base_url(DEALER_DESK_UPLOAD_URL . $file->file_path); ?>" target="_blank" rel="noopener">
                  <i class="fa fa-paperclip"></i> <?php echo html_escape($file->file_name); ?>
                </a><br>
              <?php } ?>
            <?php } ?>
          </div>
        </div>

        <?php if ($dealer) { ?>
          <div class="dd-panel">
            <div class="hd"><?php echo _l('dd_health'); ?></div>
            <div class="bd">
              <table class="dd-kv">
                <tr><td class="k"><?php echo _l('dd_open_requests'); ?></td><td><?php echo (int) $dealer->open_requests; ?></td></tr>
                <tr><td class="k"><?php echo _l('dd_overdue_requests'); ?></td><td><?php echo (int) $dealer->overdue_requests; ?></td></tr>
                <tr><td class="k"><?php echo _l('dd_last_contact'); ?></td><td><?php echo dd_relative_time($dealer->last_contact_at); ?></td></tr>
                <tr><td class="k"><?php echo _l('dd_tier'); ?></td><td><?php echo html_escape($dealer->tier_name); ?></td></tr>
              </table>
              <a href="<?php echo admin_url('dealer_desk/dealer/' . $dealer->id); ?>"
                 class="btn btn-default btn-sm btn-block" style="margin-top:12px">
                <?php echo _l('dd_full_history'); ?>
              </a>
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
