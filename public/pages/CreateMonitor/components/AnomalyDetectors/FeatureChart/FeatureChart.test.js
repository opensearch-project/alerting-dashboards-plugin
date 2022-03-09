/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, render } from 'enzyme';
import { FeatureChart } from './FeatureChart';
import AlertingFakes from '../../../../../../test/utils/helpers';

const alertingFakes = new AlertingFakes('random seed');

function getMountWrapper(customProps = {}) {
  return mount(
    <FeatureChart
      startDateTime={alertingFakes.randomTime()}
      endDateTime={alertingFakes.randomTime()}
      featureData={[]}
      isLoading={false}
      title="Test"
    />
  );
}

describe('FeatureChart', () => {
  test('renders ', () => {
    const component = (
      <FeatureChart
        startDateTime={alertingFakes.randomTime()}
        endDateTime={alertingFakes.randomTime()}
        featureData={[]}
        isLoading={false}
        title="Test"
      />
    );
    expect(render(component)).toMatchSnapshot();
  });

  test('go to page ', () => {
    const mountWrapper = getMountWrapper();
    mountWrapper.instance().goToPage(1);
    expect(mountWrapper.instance().state.activePage).toBe(1);
  });
});
