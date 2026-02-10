/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeatureChart } from './FeatureChart';
import { AlertingFakes } from '../../../../../../test/utils/helpers';

const alertingFakes = new AlertingFakes('random seed');

describe('FeatureChart', () => {
  const defaultProps = {
    startDateTime: alertingFakes.randomTime(),
    endDateTime: alertingFakes.randomTime(),
    featureData: [],
    isLoading: false,
    title: 'Test',
  };

  test('renders ', () => {
    const { container } = render(<FeatureChart {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  test('go to page ', async () => {
    const user = userEvent.setup();
    const featureData = Array.from({ length: 30 }, (_, i) => ({
      data: i,
      plotTime: Date.now() + i * 1000,
    }));

    render(<FeatureChart {...defaultProps} featureData={featureData} />);

    const nextButton = screen.queryByLabelText(/next page/i);
    if (nextButton && !nextButton.disabled) {
      await user.click(nextButton);
    }
  });
});
