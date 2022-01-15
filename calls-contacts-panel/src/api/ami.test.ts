import { getAmi, initAmi } from './ami';

import { loadConfig } from '../config';

beforeAll(async () => {
  await loadConfig();
  await initAmi();
})

describe('ami - asterisk manager interface', () => {
  it('should send and receive coreShowChannels', async () => {
    const res = await getAmi().send({
      action: 'CoreShowChannels',
    });
    console.dir(res);
    expect(res).toBeTruthy();
  });
});