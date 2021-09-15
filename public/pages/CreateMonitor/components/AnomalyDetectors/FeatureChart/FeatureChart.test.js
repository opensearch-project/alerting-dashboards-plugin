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
