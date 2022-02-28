/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { mount } from 'enzyme';

import { FORMIK_INITIAL_VALUES } from '../../CreateMonitor/utils/constants';
import AnomalyDetectors from '../AnomalyDetectors';
import { httpClientMock } from '../../../../../../test/mocks';
import { CoreContext } from '../../../../../utils/CoreContext';

// Used to wait until all of the promises have cleared, especially waiting for asynchronous Formik's handlers.
const runAllPromises = () => new Promise(setImmediate);

const renderEmptyMessage = jest.fn();
function getMountWrapper() {
  return mount(
    <CoreContext.Provider value={{ http: httpClientMock }}>
      <Formik initialValues={FORMIK_INITIAL_VALUES}>
        {({ values }) => (
          <AnomalyDetectors values={values} renderEmptyMessage={renderEmptyMessage} />
        )}
      </Formik>
    </CoreContext.Provider>
  );
}

describe('AnomalyDetectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders', () => {
    httpClientMock.post.mockResolvedValue({ ok: true, detectors: [] });
    const wrapper = getMountWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  test('should be able to select the detector', async () => {
    httpClientMock.post.mockResolvedValueOnce({
      ok: true,
      detectors: [{ name: 'sample-detector', id: 'sample-id', feature_attributes: [] }],
    });
    //Preview mock
    httpClientMock.post.mockResolvedValueOnce({
      ok: true,
      response: { anomalyResult: { anomalies: [], featureData: [] }, detector: {} },
    });
    const wrapper = getMountWrapper();

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'sample-detect' } });

    await runAllPromises();

    wrapper
      .find('[data-test-subj="comboBoxInput"]')
      .hostNodes()
      .simulate('keyDown', { key: 'ArrowDown' })
      .simulate('keyDown', { key: 'Enter' });

    // Validate the specific detector is in the input field
    expect(wrapper.find('[data-test-subj="comboBoxInput"]').hostNodes().text()).toEqual(
      'sample-detector'
    );
  });
});
