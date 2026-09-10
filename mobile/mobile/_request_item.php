<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php
/**
 * One row on the day rail.
 *
 * Dealer name is the biggest text because employees recall the work by
 * dealer, never by reference number. Everything else earns its place by
 * answering "what do I do next?".
 */
$late  = !empty($request->due_at) && strtotime($request->due_at) < time() && dd_is_open_status($request->status);
$days  = $late ? dd_overdue_days($request->due_at) : 0;
$ready = $request->completion_required > 0 && $request->completion_done >= $request->completion_required;

// On a dealer's own card the dealer name is already the page title, so the
// reference carries more than repeating it on every row would.
$hide_dealer = !empty($hide_dealer);
?>
<a href="<?php echo admin_url('dealer_desk/m_request/' . $request->id); ?>"
   class="dd-item <?php echo dd_priority_class($request->priority); ?>"
   data-dd-swipe data-id="<?php echo $request->id; ?>">

  <span class="who">
    <?php if ($hide_dealer) { ?>
      <?php // The type already reads on the line below; the ref is what differs. ?>
      <?php echo html_escape($request->ref_no); ?>
      <?php if ($request->title) { ?>
        <span class="city"><?php echo html_escape($request->title); ?></span>
      <?php } ?>
    <?php } else { ?>
      <?php echo html_escape($request->dealer_name ?: _l('dd_unassigned')); ?>
      <?php if ($request->dealer_city) { ?>
        <span class="city"><?php echo html_escape($request->dealer_city); ?></span>
      <?php } ?>
    <?php } ?>
  </span>

  <span class="what">
    <?php if ($request->type_icon) { ?><i class="fa <?php echo html_escape($request->type_icon); ?>"></i> <?php } ?>
    <?php echo html_escape($request->type_name); ?>
    <?php if ($request->title) { ?>
      <span class="dd-muted">· <?php echo html_escape($request->title); ?></span>
    <?php } ?>
  </span>

  <span class="foot">
    <?php if (!empty($show_late) && $late) { ?>
      <span class="dd-late">
        <?php echo $days <= 1 ? _l('dd_day_late') : _l('dd_days_late', $days); ?>
      </span>
    <?php } elseif ($late) { ?>
      <span class="dd-late"><i class="fa fa-exclamation-circle"></i></span>
    <?php } ?>

    <?php if ($request->completion_required > 0) { ?>
      <span class="dd-progress <?php echo $ready ? 'complete' : ''; ?>">
        <span class="bar">
          <?php for ($i = 0; $i < $request->completion_required; $i++) { ?>
            <span class="seg <?php echo $i < $request->completion_done ? 'on' : ''; ?>"></span>
          <?php } ?>
        </span>
        <?php echo _l('dd_details_progress', [(int) $request->completion_done, (int) $request->completion_required]); ?>
      </span>
    <?php } ?>

    <?php if (in_array($request->status, ['waiting_dealer', 'waiting_internal'], true)) { ?>
      <span class="dd-pill dd-pill-muted"><?php echo dd_status_label($request->status); ?></span>
    <?php } ?>
  </span>

  <?php
    // One inline action: the single most likely next step, pre-decided.
    // A locked request has none — its document already exists, and offering
    // "finish details" would walk the user into a write the server refuses.
    $dd_locked = !empty($request->locked_at);
  ?>
  <?php if ($dd_locked) { ?>
    <span class="dd-inline-action ghost"><i class="fa fa-lock"></i> <?php echo dd_doc_state_label($request->doc_state); ?></span>
  <?php } elseif ($ready) { ?>
    <span class="dd-inline-action"><i class="fa fa-check"></i> <?php echo _l('dd_ready_to_push'); ?></span>
  <?php } elseif ($request->completion_required > 0 && $request->completion_done < $request->completion_required) { ?>
    <span class="dd-inline-action ghost"><?php echo _l('dd_finish_details'); ?> <i class="fa fa-arrow-right"></i></span>
  <?php } ?>
</a>
