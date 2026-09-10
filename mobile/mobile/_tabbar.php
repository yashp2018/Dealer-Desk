<?php defined('BASEPATH') or exit('No direct script access allowed'); ?>
<?php $active = isset($active) ? $active : ''; ?>
<div class="dd-tabbar">
  <a href="<?php echo admin_url('dealer_desk/m'); ?>" class="<?php echo $active === 'day' ? 'active' : ''; ?>">
    <i class="fa fa-list"></i><?php echo _l('dd_day'); ?>
  </a>
  <a href="<?php echo admin_url('dealer_desk/m_week'); ?>" class="<?php echo $active === 'week' ? 'active' : ''; ?>">
    <i class="fa fa-calendar"></i><?php echo _l('dd_week'); ?>
  </a>
  <a href="<?php echo admin_url('dealer_desk/m_dealers'); ?>" class="<?php echo $active === 'dealers' ? 'active' : ''; ?>">
    <i class="fa fa-building"></i><?php echo _l('dd_dealers'); ?>
  </a>
  <a href="<?php echo admin_url('dealer_desk'); ?>" class="<?php echo $active === 'desk' ? 'active' : ''; ?>">
    <i class="fa fa-desktop"></i><?php echo _l('dd_open_in_desktop'); ?>
  </a>
</div>
