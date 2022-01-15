import * as appRoot from 'app-root-path';

import { join } from 'path';

export function getProperPath(path: string) {
  if (path.startsWith('./') || path.startsWith('../'))
    return join(appRoot.toString(), path);
  return path;
}