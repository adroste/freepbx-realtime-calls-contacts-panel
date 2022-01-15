<?php
namespace FreePBX\modules;
use Exception;
use Symfony\Component\Console\Helper\ProgressBar;

class Callpanel implements \BMO
{
	private $nodever = '14.15.0';
	private $npmver = '6.14.8';
	private $nodeloc = '/tmp';

	public function __construct($freepbx = null)
	{
		if ($freepbx == null) {
			throw new Exception('Not given a FreePBX Object');
		}
		$this->freepbx = $freepbx;
		$this->db = $freepbx->Database;
		$this->nodeloc = __DIR__ . '/calls-contacts-panel';
	}
	//Install method. use this or install.php using both may cause weird behavior
	public function install()
	{
		$output = exec('node --version 2>/dev/null '); //v0.10.29
		$output = str_replace('v', '', trim($output));
		if (empty($output)) {
			out(_('Node is not installed'));
			return false;
		} elseif (version_compare($output, $this->nodever, '<')) {
			out(
				sprintf(
					_('Node version is: %s requirement is %s'),
					$output,
					$this->nodever
				)
			);
			return false;
		}
		$output = exec('npm --version'); //v0.10.29
		$output = trim($output);
		if (empty($output)) {
			out(_('Node Package Manager is not installed'));
			return false;
		}
		if (version_compare($output, $this->npmver, '<')) {
			out(
				sprintf(
					_('NPM version is: %s requirement is %s'),
					$output,
					$this->npmver
				)
			);
			return false;
		}

		outn(
			_(
				'Installing/Updating Required Libraries. This may take a while...'
			)
		);
		if (php_sapi_name() == 'cli') {
			out(
				"The following messages are ONLY FOR DEBUGGING. Ignore anything that says 'WARN' or is just a warning"
			);
		}
		$this->freepbx->Pm2->installNodeDependencies($this->nodeloc, function (
			$data
		) {
			outn($data);
		});
		out('');
		out(_('Finished updating libraries!'));

		$this->stopFreepbx();
		$started = $this->startFreepbx();
		if (!$started) {
			out(_('Failed!'));
		} else {
			out(sprintf(_('Started with PID %s!'), $started));
		}
	}
	//Uninstall method. use this or install.php using both may cause weird behavior
	public function uninstall()
	{
		outn(_('Stopping old running processes...'));
		$this->stopFreepbx();
		out(_('Done'));
		exec('rm -Rf ' . $this->nodeloc . '/node_modules');
		try {
			$this->freepbx->Pm2->delete('callpanel');
		} catch (\Exception $e) {
		}
	}
	//Not yet implemented
	public function backup()
	{
	}
	//not yet implimented
	public function restore($backup)
	{
	}
	//process form
	public function doConfigPageInit($page)
	{
		if ($_SERVER['REQUEST_METHOD'] != 'POST' || $_POST['randcheck'] != $_SESSION['rand']) {
			return;
		}

		$currentLocalconf = $this->readConfig()['local']; 
		$localconf = $currentLocalconf;
		if (!empty($_POST['callerIdPrefixes'])) {
			$localconf['callerIdPrefixes'] = array_values(array_filter(array_map('trim', explode(',', $_POST['callerIdPrefixes']))));
		} else {
			unset($localconf['callerIdPrefixes']);
		}
		if (!empty($_POST['callerIdResolveLength'])) {
			$callerIdResolveLength = intval($_POST['callerIdResolveLength']);
			if ($callerIdResolveLength < 2) {
				echo '<div class="alert alert-danger" role="alert">'._('Caller ID Resolve Length must be larger than 1.').'</div>';
			} else {
				$localconf['callerIdResolveLength'] = $callerIdResolveLength;
			}
		} else {
			unset($localconf['callerIdResolveLength']);
		}
		if (!empty($_POST['httpPort'])) {
			$httpPort = intval($_POST['httpPort']);
			if ($httpPort < 1024 || $httpPort > 65535) {
				echo '<div class="alert alert-danger" role="alert">'._('Http Port must be between 1024 and 65535.').'</div>';
			} else {
				$localconf['httpPort'] = $httpPort;
			}
		} else {
			unset($localconf['httpPort']);
		}
		if (!empty($_POST['activeCallsCheckIntervalMs'])) {
			$activeCallsCheckIntervalMs = intval($_POST['activeCallsCheckIntervalMs']);
			if ($activeCallsCheckIntervalMs < 200) {
				echo '<div class="alert alert-danger" role="alert">'._('Check for Active Calls Interval (ms) be larger than 200.').'</div>';
			} else {
				$localconf['activeCallsCheckIntervalMs'] = $activeCallsCheckIntervalMs;
			}
		} else {
			unset($localconf['activeCallsCheckIntervalMs']);
		}
		if (!empty($_POST['callLogsCheckIntervalMs'])) {
			$callLogsCheckIntervalMs = intval($_POST['callLogsCheckIntervalMs']);
			if ($callLogsCheckIntervalMs < 500) {
				echo '<div class="alert alert-danger" role="alert">'._('Check for Call Logs Interval (ms) be larger than 500.').'</div>';
			} else {
				$localconf['callLogsCheckIntervalMs'] = $callLogsCheckIntervalMs;
			}
		} else {
			unset($localconf['callLogsCheckIntervalMs']);
		}
		if (!empty($_POST['phonebookCheckIntervalMs'])) {
			$phonebookCheckIntervalMs = intval($_POST['phonebookCheckIntervalMs']);
			if ($phonebookCheckIntervalMs < 2000) {
				echo '<div class="alert alert-danger" role="alert">'._('Check for externally changed Phonebook Entries Interval (ms) be larger than 2000.').'</div>';
			} else {
				$localconf['phonebookCheckIntervalMs'] = $phonebookCheckIntervalMs;
			}
		} else {
			unset($localconf['phonebookCheckIntervalMs']);
		}

		if ($localconf != $currentLocalconf) {
			try {
				$this->saveConfig($localconf);
				echo '<div class="alert alert-success" role="alert">'._('Config values saved!').'</div>';
				$needsRestart = true;
			} catch (\Exception $e) {
				echo '<div class="alert alert-danger" role="alert">'._('Config values could not get saved').'</div>';
			}
		}

		$changeStatus = $_POST['changeStatus'];
		if ($changeStatus == 'stop') {
			$stopped = $this->stopFreepbx();
			if (!$stopped) {
				echo '<div class="alert alert-danger" role="alert">'._('Calls and Contacts Panel could not get stopped').'</div>';
			} else {
				echo '<div class="alert alert-success" role="alert">'._('Calls and Contacts Panel stopped!').'</div>';
			}
		} else if ($changeStatus == 'start' || $changeStatus == 'restart' || $needsRestart) {
			$this->stopFreepbx();
			$started = $this->startFreepbx();
			if (!$started) {
				echo '<div class="alert alert-danger" role="alert">'._('Calls and Contacts Panel could not get (re-)started').'</div>';
			} else {
				echo '<div class="alert alert-success" role="alert">'._('Calls and Contacts Panel (re-)started!').'</div>';
			}
		}
	}
	//This shows the submit buttons
	public function getActionBar($request)
	{
		$buttons = [];
		switch ($_GET['display']) {
			case 'callpanel':
				$buttons = [
					'reset' => [
						'name' => 'reset',
						'id' => 'reset',
						'value' => _('Reset'),
					],
					'submit' => [
						'name' => 'submit',
						'id' => 'submit',
						'value' => _('Submit'),
					],
				];
				break;
		}
		return $buttons;
	}
	public function showPage()
	{
		$conf = $this->readConfig();
		$status = $this->freepbx->Pm2->getStatus('callpanel');
		$running = $status['pm2_env']['status'] == 'online';
		return load_view(__DIR__ . '/views/main.php', [
			'defaultconf' => $conf['default'],
			'localconf' => $conf['local'],
			'running' => $running,
		]);
	}
	public function ajaxRequest($req, &$setting)
	{
	}
	public function ajaxHandler()
	{
	}

	public function getRightNav($request)
	{
	}

	public function startFreepbx($output = null)
	{
		$status = $this->freepbx->Pm2->getStatus('callpanel');
		switch ($status['pm2_env']['status']) {
			case 'online':
				if (is_object($output)) {
					$output->writeln(
						sprintf(
							_(
								'Calls and Contacts Panel has already been running on PID %s for %s'
							),
							$status['pid'],
							$status['pm2_env']['created_at_human_diff']
						)
					);
				}
				return $status['pid'];
				break;
			default:
				if (is_object($output)) {
					$output->writeln(_('Starting Calls and Contacts Panel...'));
				}
				$this->freepbx->Pm2->start(
					'callpanel',
					// $this->nodeloc.'/build/src/main.js run-as-service'
					$this->nodeloc.'/pm2.config.js'
				);
				$this->freepbx->Pm2->reset('callpanel');
				if (is_object($output)) {
					$progress = new ProgressBar($output, 0);
					$progress->setFormat('[%bar%] %elapsed%');
					$progress->start();
				}
				$i = 0;
				while ($i < 10) {
					$data = $this->freepbx->Pm2->getStatus('callpanel');
					if (
						!empty($data) &&
						$data['pm2_env']['status'] == 'online'
					) {
						if (is_object($output)) {
							$progress->finish();
						}
						break;
					}
					if (is_object($output)) {
						$progress->setProgress($i * 10);
					}
					$i++;
					sleep(1);
				}
				if (is_object($output)) {
					$output->writeln('');
				}
				if (!empty($data)) {
					if (is_object($output)) {
						$output->writeln(
							sprintf(
								_(
									'Started Calls and Contacts Panel. PID is %s'
								),
								$data['pid']
							)
						);
					}
					return $data['pid'];
				}
				if (is_object($output)) {
					$output->write(
						'<error>' .
							sprintf(
								_("Failed to run: '%s'") . '</error>',
								$command
							)
					);
				}
				break;
		}
		return false;
	}

	/**
	 * Stop FreePBX for fwconsole hook
	 * @param object $output The output object.
	 */
	public function stopFreepbx($output = null)
	{
		$data = $this->freepbx->Pm2->getStatus('callpanel');
		if (empty($data) || $data['pm2_env']['status'] != 'online') {
			if (is_object($output)) {
				$output->writeln(
					'<error>' .
						_('Calls and Contacts Panel is not running') .
						'</error>'
				);
			}
			return false;
		}

		// executes after the command finishes
		if (is_object($output)) {
			$output->writeln(_('Stopping Calls and Contacts Panel'));
		}

		$this->freepbx->Pm2->stop('callpanel');

		$data = $this->freepbx->Pm2->getStatus('callpanel');
		if (empty($data) || $data['pm2_env']['status'] != 'online') {
			if (is_object($output)) {
				$output->writeln(_('Stopped Calls and Contacts Panel'));
			}
		} else {
			if (is_object($output)) {
				$output->writeln(
					'<error>' .
						sprintf(
							_('Calls and Contacts Panel Failed: %s') .
								'</error>',
							$process->getErrorOutput()
						)
				);
			}
			return false;
		}

		return true;
	}

	function readConfig()
	{
		$defaultStr = file_get_contents($this->nodeloc . '/config.default.json');
		if ($defaultStr === false) {
			throw new Exception('default config not found');
		}
		$defaultconf = json_decode($defaultStr, true);
		if ($defaultconf === null) {
			throw new Exception('default config not a json file');
		}

		try {
			$localStr = file_get_contents($this->nodeloc . '/config.local.json');
		} catch (\Exception $e) {}
		if (!isset($localStr) || $localStr === false) {
			$localStr = '{}';
		}
		$localconf = json_decode($localStr, true);
		if ($localconf === null) {
			throw new Exception('local config not a json file');
		}

		return ['default' => $defaultconf, 'local' => $localconf];
	}

	function saveConfig($localconf) {
		if (empty($localconf)) {
			$json = '{}';
		} else {
			$json = json_encode($localconf, JSON_PRETTY_PRINT);
		}
		$res = file_put_contents($this->nodeloc . '/config.local.json', $json);
		if ($res === false) {
			throw new Exception('config could not be written');
		}
	}
}
