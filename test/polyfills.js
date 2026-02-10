/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MutationObserver } from './polyfills/mutationObserver';
import util from 'util';

Object.defineProperty(window, 'MutationObserver', { value: MutationObserver });

Object.defineProperty(global, 'TextEncoder', {
  value: util.TextEncoder,
});

Object.defineProperty(global, 'TextDecoder', {
  value: util.TextDecoder,
});

document.createRange = () => ({
  setStart: () => {},
  setEnd: () => {},
  commonAncestorContainer: {
    nodeName: 'BODY',
    ownerDocument: document,
  },
});
