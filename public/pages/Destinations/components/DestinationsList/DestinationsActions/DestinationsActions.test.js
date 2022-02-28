/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import DestinationsActions from './DestinationsActions';

describe('<DestinationsActions />', () => {
  test('should render DestinationsActions', () => {
    const wrapper = render(<DestinationsActions isEmailAllowed={true} />);
    expect(wrapper).toMatchSnapshot();
  });
});
