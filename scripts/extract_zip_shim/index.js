/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// extract-zip 2.0.1 is its final release and has no fix for CVE-2026-56876 or
// CVE-2026-19693, both of which allow writes outside the destination directory
// through symlink archive entries. A `**/extract-zip` resolution points the
// package name at this shim so devDependencies that hard-code
// `require('extract-zip')` (cypress) get a safe implementation without changes
// to their code. Same approach as OpenSearch-Dashboards#12920.
//
// @electron-internal/extract-zip is ESM-only and exports a named `extract`
// rather than a callable default, so it is loaded with a dynamic import. That
// keeps `require()` of this shim synchronous, which is what the callers expect.
//
// Only `dir` is forwarded: the replacement's options are `{ dir }` alone. Any
// `onEntry` callback is accepted and ignored, so cypress's unzip progress
// indicator no longer advances; extraction itself still completes normally.
module.exports = function extractZip(zipPath, opts) {
  const dir = opts && opts.dir;
  return import('@electron-internal/extract-zip').then(function (mod) {
    return mod.extract(zipPath, { dir: dir });
  });
};
