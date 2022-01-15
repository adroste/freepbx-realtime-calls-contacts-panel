import { AMI_ACTION_TYPES } from './ami-types';
import { getAmi } from './ami';

const TAG = '[Make Call]';

/**
 * Originate a call
 * @param from from phone number (internal extension)
 * @param to to phone number
 */
export async function makeCall(from: string, to: string) {
  try {
    // see: https://wiki.asterisk.org/wiki/display/AST/Asterisk+19+ManagerAction_Originate
    await getAmi().send({
      action: AMI_ACTION_TYPES.Originate,
      // info copied from https://github.com/FreePBX/ucp/blob/2021e6a87b1c422dfa5fd6dea733654a9e26c225/htdocs/modules/Home/Home.class.php#L116
      Channel: `local/${from}@originate-skipvm`,
      Exten: to,
      Context: 'from-internal',
      Priority: 1,
      CallerID: `<${from}>`,
      Async: true,
    });
  } catch (err) {
    console.error(TAG, 'originate command failed', err);
  }
}