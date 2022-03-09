/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { EmptyFeaturesMessage } from './EmptyFeaturesMessage';

describe('EmptyFeaturesMessage', () => {
  test('renders ', () => {
    const component = <EmptyFeaturesMessage detectorId="tempId" />;
    expect(render(component)).toMatchSnapshot();
  });
});
