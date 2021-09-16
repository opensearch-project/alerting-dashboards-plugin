/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import React from 'react';
import { render } from 'enzyme';

import IconToolTip from './IconToolTip';

describe('IconToolTip', () => {
  test('renders', () => {
    const component = <IconToolTip iconType="questionInCircle" content="test content" />;
    expect(render(component)).toMatchSnapshot();
  });
});
