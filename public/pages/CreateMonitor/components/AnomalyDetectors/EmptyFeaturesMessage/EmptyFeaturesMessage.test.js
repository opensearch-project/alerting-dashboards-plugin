/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';
import { EmptyFeaturesMessage } from './EmptyFeaturesMessage';
import { PREVIEW_ERROR_TYPE } from '../../../../../utils/constants';

describe('EmptyFeaturesMessage', () => {
  test('renders no feature', () => {
    const component = <EmptyFeaturesMessage detectorId="tempId" />;
    expect(render(component)).toMatchSnapshot();
  });
  test('renders no enabled feature', () => {
    const component = (
      <EmptyFeaturesMessage
        detectorId="tempId"
        previewErrorType={PREVIEW_ERROR_TYPE.NO_ENABLED_FEATURES}
      />
    );
    const wrapper = render(component);
    expect(wrapper.find('[data-test-subj~="editButton"]').text()).toEqual('Enable Feature');
  });
});
