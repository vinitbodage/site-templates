/*
 * Shared helpers for the "template2" hotel-business template blocks.
 *
 * These exist so the template blocks read the authored structure the same
 * way. Anything used by only one block stays in that block. Logic that isn't
 * brand-specific lives in shared.js and is reused across templates.
 */

import { createHeadingHelpers } from './shared.js';

export {
  getRows, getCells, isEmpty, optimizePicture,
} from './shared.js';

export const { splitHeading, addRule } = createHeadingHelpers('template2');
