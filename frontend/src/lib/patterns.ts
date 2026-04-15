/**
 * Patterns — re-export from chunked pattern files.
 *
 * This file maintains backward compatibility with all existing components
 * that import from '@/lib/patterns'.
 *
 * New code should import from the chunked files directly:
 *   import { panelPatterns } from '@/lib/patterns';
 */

export { patterns, patterns as default } from './patterns/index';

export {
  typographyPatterns,
  controlPatterns,
  buttonPatterns,
  panelPatterns,
  toolbarPatterns,
  menuBarPatterns,
  modellingPatterns,
  assetPatterns,
  skeletonPatterns,
  viewportPatterns,
  exportPatterns,
  statusBarPatterns,
} from './patterns/index';
