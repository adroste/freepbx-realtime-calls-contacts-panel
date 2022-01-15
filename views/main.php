<?php
if (!defined('FREEPBX_IS_AUTH')) { die('No direct script access allowed'); }
$callPanelUrl = 'http://'.$_SERVER['HTTP_HOST'].':'.($localconf['httpPort'] ? $localconf['httpPort'] : $defaultconf['httpPort']).'/callpanel';
?>

<div style="
  margin: 1em auto;
  max-width: 800px;
">
  <p>
    <strong>URLs:</strong>
    <ul>
      <li>Calls &amp; Contacts Panel: <a href="<?php echo $callPanelUrl.'/' ?>" target="_blank"><?php echo $callPanelUrl.'/' ?></a></li>
      <li>Caller ID Lookup: <a href="<?php echo $callPanelUrl.'/lookupcallerid?number=' ?>" target="_blank"><?php echo $callPanelUrl.'/lookupcallerid?number=[NUMBER]' ?></a></li>
      <li>Phonebook Fanvil: <a href="<?php echo $callPanelUrl.'/fanvil-phonebook.xml' ?>" target="_blank"><?php echo $callPanelUrl.'/fanvil-phonebook.xml' ?></a></li>
      <li>Phonebook Yealink: <a href="<?php echo $callPanelUrl.'/yealink-phonebook.xml' ?>" target="_blank"><?php echo $callPanelUrl.'/yealink-phonebook.xml' ?></a></li>
    </ul>
  </p>
  <p style="font-size: 12px;">
    <em>Backend Logs can be viewed with: <code>fwconsole pm2 --log=callpanel</code></em>
  </p>
</div>

<hr style="margin: 1em;">

<form 
  onsubmit="(function(){document.getElementById('waitoverlay').style.display='flex';})()" 
  class="fpbx-submit form-horizontal" 
  name="frm_callpanel" 
  action="" 
  method="post" 
  role="form"
  style="position: relative;"
>
  <?php
    $rand=rand();
    $_SESSION['rand']=$rand;
  ?>
  <input type="hidden" value="<?php echo $rand; ?>" name="randcheck" />
  <div id="waitoverlay" style="
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    font-size: 2em;
    color: white;
    background: rgba(0,0,0,.5);
    z-index: 1;
    justify-content: center;
    align-items: center;
  ">Please wait...</div>
  <div class="form-group">
    <label for="changeStatus" class="control-label col-xs-3">Service Status?</label> 
    <div class="col-xs-9">
      <label class="radio-inline">
        <input type="radio" name="changeStatus" value="start">
              Start
      </label>
      <label class="radio-inline">
        <input type="radio" name="changeStatus" value="stop">
              Stop
      </label>
      <label class="radio-inline">
        <input type="radio" name="changeStatus" value="restart">
              Restart
      </label>
      <label class="radio-inline">
        <input type="radio" name="changeStatus" value="no" checked>
              Don't change
      </label>
      <span style="
          padding-left: 1em;
          vertical-align: middle;
          padding-top: 7px;
          display: inline-block;
      ">
        Current: <?php echo $running ? '<span style="color: green;">Running</span>' : '<span style="color: red;">Not Running</span>' ?>
      </span>
      <span style="
          padding-left: 2em;
          vertical-align: middle;
          padding-top: 7px;
          display: inline-block;
          font-style: italic;
          font-size: 12px;
          color: darkred;
      ">
        Please be patient after submitting a change, start/stop takes a long time!
      </span>
    </div>
  </div>
  <div class="form-group">
    <label for="text" class="control-label col-xs-3">Caller ID Prefixes</label> 
    <div class="col-xs-9">
      <input id="callerIdPrefixes" name="callerIdPrefixes" type="text" placeholder="<?php echo implode(",", $defaultconf['callerIdPrefixes'] ?? []) ?>" value="<?php echo implode(",", $localconf['callerIdPrefixes'] ?? []) ?>" class="form-control" aria-describedby="callerIdPrefixesHelpBlock"> 
      <span id="callerIdPrefixesHelpBlock" class="help-block">Comma separated, e.g.: +4954321,054321, Default: <?php echo implode(",", $defaultconf['callerIdPrefixes'] ?? []) ?></span>
    </div>
  </div>
  <div class="form-group">
    <label for="callerIdResolveLength" class="control-label col-xs-3">Caller ID Resolve Length</label> 
    <div class="col-xs-9">
      <input id="callerIdResolveLength" name="callerIdResolveLength" placeholder="<?php echo $defaultconf['callerIdResolveLength'] ?>" type="text" value="<?php echo $localconf['callerIdResolveLength'] ?>" class="form-control" aria-describedby="callerIdResolveLengthHelpBlock"> 
      <span id="callerIdResolveLengthHelpBlock" class="help-block">Default: <?php echo $defaultconf['callerIdResolveLength'] ?></span>
    </div>
  </div>
  <div class="form-group">
    <label for="httpPort" class="control-label col-xs-3">HTTP Port</label> 
    <div class="col-xs-9">
      <input id="httpPort" name="httpPort" placeholder="<?php echo $defaultconf['httpPort'] ?>" type="text" value="<?php echo $localconf['httpPort'] ?>" class="form-control" aria-describedby="httpPortHelpBlock"> 
      <span id="httpPortHelpBlock" class="help-block">Default: <?php echo $defaultconf['httpPort'] ?></span>
    </div>
  </div>
  <div class="form-group">
    <label class="control-label col-xs-3" for="activeCallsCheckIntervalMs">Check for Active Calls Interval (ms)</label> 
    <div class="col-xs-9">
      <input id="activeCallsCheckIntervalMs" name="activeCallsCheckIntervalMs" placeholder="<?php echo $defaultconf['activeCallsCheckIntervalMs'] ?>" type="text" value="<?php echo $localconf['activeCallsCheckIntervalMs'] ?>" class="form-control" aria-describedby="activeCallsCheckIntervalMsHelpBlock"> 
      <span id="activeCallsCheckIntervalMsHelpBlock" class="help-block">Default: <?php echo $defaultconf['activeCallsCheckIntervalMs'] ?></span>
    </div>
  </div>
  <div class="form-group">
    <label for="callLogsCheckIntervalMs" class="control-label col-xs-3">Check for Call Logs Interval (ms)</label> 
    <div class="col-xs-9">
      <input id="callLogsCheckIntervalMs" name="callLogsCheckIntervalMs" placeholder="<?php echo $defaultconf['callLogsCheckIntervalMs'] ?>" type="text" value="<?php echo $localconf['callLogsCheckIntervalMs'] ?>" class="form-control" aria-describedby="callLogsCheckIntervalMsHelpBlock"> 
      <span id="callLogsCheckIntervalMsHelpBlock" class="help-block">Default: <?php echo $defaultconf['callLogsCheckIntervalMs'] ?></span>
    </div>
  </div>
  <div class="form-group">
    <label for="phonebookCheckIntervalMs" class="control-label col-xs-3">Check for externally changed Phonebook Entries Interval (ms)</label> 
    <div class="col-xs-9">
      <input id="phonebookCheckIntervalMs" name="phonebookCheckIntervalMs" placeholder="<?php echo $defaultconf['phonebookCheckIntervalMs'] ?>" type="text" value="<?php echo $localconf['phonebookCheckIntervalMs'] ?>" class="form-control" aria-describedby="phonebookCheckIntervalMsHelpBlock"> 
      <span id="phonebookCheckIntervalMsHelpBlock" class="help-block">Default: <?php echo $defaultconf['phonebookCheckIntervalMs'] ?></span>
    </div>
  </div> 
</form>