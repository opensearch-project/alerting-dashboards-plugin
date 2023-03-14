/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { EmptyFeaturesMessage } from './EmptyFeaturesMessage';

describe('EmptyFeaturesMessage', () => {
  test('renders no feature', () => {
    const component = <EmptyFeaturesMessage detectorId="tempId" />;
    expect(render(component)).toMatchSnapshot();
  });
  test('renders HC sparse data', () => {
    const component = (
      <EmptyFeaturesMessage
        detectorId="tempId"
        isHCDetector={true}
        features={[
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: true,
            aggregationQuery: { time: { max: { field: 'time' } } },
          },
        ]}
      />
    );
    const wrapper = render(component);
    expect(wrapper.find('[data-test-subj~="editConfigButton"]').text()).toEqual(
      'Check Detector Interval'
    );
    expect(wrapper.find('[data-test-subj~="empty-prompt"]').text()).toContain('for some entities');
  });
  test('renders error', () => {
    const error = 'request failure';
    const component = <EmptyFeaturesMessage detectorId="tempId" error={error} />;
    const wrapper = render(component);
    expect(wrapper.text()).toEqual(error);
  });
  test('renders no enabled feature', () => {
    const component = (
      <EmptyFeaturesMessage
        detectorId="tempId"
        features={[
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: false,
            aggregationQuery: { time: { max: { field: 'time' } } },
          },
        ]}
      />
    );
    const wrapper = render(component);
    expect(wrapper.find('[data-test-subj~="editButton"]').text()).toEqual('Enable Feature');
  });
  test('renders single-stream sparse data', () => {
    const component = (
      <EmptyFeaturesMessage
        detectorId="tempId"
        isHCDetector={false}
        features={[
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: true,
            aggregationQuery: { time: { max: { field: 'time' } } },
          },
        ]}
      />
    );
    const wrapper = render(component);
    expect(wrapper.find('[data-test-subj~="editConfigButton"]').text()).toEqual(
      'Check Detector Interval'
    );
    expect(wrapper.find('[data-test-subj~="empty-prompt"]').text()).not.toContain(
      'for some entities'
    );
  });
});
