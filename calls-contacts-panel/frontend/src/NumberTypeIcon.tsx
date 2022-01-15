import { BriefcaseIcon, DeviceMobileIcon, HomeIcon, PhoneIcon, PhoneIncomingIcon } from '@heroicons/react/solid';

import { PHONE_NUMBER_TYPES } from './wsApiTypes';

export function NumberTypeIcon({ type }: { type: typeof PHONE_NUMBER_TYPES[number] }) {
  switch (type) {
    case 'cell':
      return <DeviceMobileIcon />;
    case 'home':
      return <HomeIcon />;
    case 'work':
      return <BriefcaseIcon />;
    case 'internal':
      return <PhoneIncomingIcon />;
    default:
      return <PhoneIcon />;
  }
}