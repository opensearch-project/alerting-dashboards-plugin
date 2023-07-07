/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, mount } from 'enzyme';
import { Formik } from 'formik';
import { AnomalyDetectorTrigger } from './AnomalyDetectorTrigger';
import { httpClientMock } from '../../../../../test/mocks';
import { CoreContext } from '../../../../../public/utils/CoreContext';

// enabling waiting until all of the promiseds have cleared: https://tinyurl.com/5hym6n9b
const runAllPromises = () => new Promise(setImmediate);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AnomalyDetectorTrigger', () => {
  const AppContext = React.createContext({
    httpClient: { httpClientMock },
    notifications: undefined,
  });

  test('renders no feature', () => {
    const component = <AnomalyDetectorTrigger detectorId="tempId" />;
    expect(render(component)).toMatchSnapshot();
  });
  test('renders no detector id', () => {
    const component = <AnomalyDetectorTrigger />;
    expect(render(component)).toMatchSnapshot();
  });
  test('renders preview sparse data', async () => {
    // using it since it will render React.Fragment that rendering AnomalyDetectorTrigger returns
    const response = {
      anomalyResult: {
        anomalies: [],
        featureData: {},
      },
      detector: {
        featureAttributes: [
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: true,
            aggregationQuery: {
              time: {
                max: {
                  field: 'time',
                },
              },
            },
          },
        ],
      },
    };

    // Mock return in get preview function
    httpClientMock.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ ok: true, response: response }));
    const wrapper = mount(
      // put it under Formik to render TriggerExpressions that has Formik fields.
      // rendering TriggerExpressions also require adValues to be passed in
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <Formik>
          <AnomalyDetectorTrigger
            detectorId="tempId"
            adValues={{
              anomalyGradeThresholdValue: 0.7,
              anomalyGradeThresholdEnum: 'ABOVE',
              anomalyConfidenceThresholdValue: 0.7,
              anomalyConfidenceThresholdEnum: 0.7,
            }}
            fieldPath=""
          />
        </Formik>
      </CoreContext.Provider>
    );

    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    await runAllPromises();

    // without update, we will finish mount before the embedded async AnomalyDetectorData finish mounting
    wrapper.update();

    expect(wrapper.update().find('[data-test-subj~="empty-prompt"]').exists()).toBe(false);
    expect(
      wrapper
        .find('[data-test-subj~="anomalyDetector.anomalyGradeThresholdEnum_conditionEnumField"]')
        .exists()
    ).toBe(true);
    expect(
      wrapper
        .find(
          '[data-test-subj~="anomalyDetector.anomalyConfidenceThresholdValue_conditionValueField"]'
        )
        .exists()
    ).toBe(true);
  });
  test('renders no enabled feature', async () => {
    const response = {
      anomalyResult: {
        anomalies: [],
        featureData: {},
      },
      detector: {
        featureAttributes: [
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: false,
            aggregationQuery: {
              time: {
                max: {
                  field: 'time',
                },
              },
            },
          },
        ],
      },
      error: '',
    };

    // Mock return in get preview function
    httpClientMock.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ ok: true, response: response }));
    const wrapper = mount(
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <AnomalyDetectorTrigger detectorId="tempId" />
      </CoreContext.Provider>
    );

    await runAllPromises();

    // without update, we will finish mount before the embedded async AnomalyDetectorData finish mounting
    expect(wrapper.update().find('[data-test-subj~="empty-prompt"]').exists()).toBe(true);
    expect(wrapper.find('.euiButton__text').text()).toEqual('Enable Feature');
    expect(wrapper.update().find('[data-test-subj~="_conditionEnumField"]').exists()).toBe(false);
    expect(wrapper.update().find('[data-test-subj~="_conditionValueField"]').exists()).toBe(false);
  });
  test('renders error', async () => {
    const response = {
      anomalyResult: {
        anomalies: [],
        featureData: {},
      },
      detector: {
        featureAttributes: [
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: true,
            aggregationQuery: {
              time: {
                max: {
                  field: 'time',
                },
              },
            },
          },
        ],
      },
      error: 'request error',
    };

    // Mock return in get preview function
    httpClientMock.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ ok: true, response: response }));
    const wrapper = mount(
      // put it under Formik to render TriggerExpressions that has Formik fields.
      // rendering TriggerExpressions also require adValues to be passed in
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <Formik>
          <AnomalyDetectorTrigger
            detectorId="tempId"
            adValues={{
              anomalyGradeThresholdValue: 0.7,
              anomalyGradeThresholdEnum: 'ABOVE',
              anomalyConfidenceThresholdValue: 0.7,
              anomalyConfidenceThresholdEnum: 0.7,
            }}
            fieldPath=""
          />
        </Formik>
      </CoreContext.Provider>
    );

    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    await runAllPromises();

    // without update, we will finish mount before the embedded async AnomalyDetectorData finish mounting
    wrapper.update();

    console.log(wrapper.debug());
    expect(wrapper.update().find('[data-test-subj~="empty-prompt"]').exists()).toBe(false);
    expect(
      wrapper
        .find('[data-test-subj~="anomalyDetector.anomalyGradeThresholdEnum_conditionEnumField"]')
        .exists()
    ).toBe(true);
    expect(
      wrapper
        .find(
          '[data-test-subj~="anomalyDetector.anomalyConfidenceThresholdValue_conditionValueField"]'
        )
        .exists()
    ).toBe(true);
  });
  test('feature has priority over preview error', async () => {
    const response = {
      anomalyResult: {
        anomalies: [],
        featureData: {},
      },
      detector: {
        featureAttributes: [
          {
            featureId: 'TV6fFYYB7j86MXY_Bzh2',
            featureName: 'time',
            featureEnabled: false,
            aggregationQuery: {
              time: {
                max: {
                  field: 'time',
                },
              },
            },
          },
        ],
      },
      error: 'request error',
    };

    // Mock return in get preview function
    httpClientMock.get = jest
      .fn()
      .mockImplementation(() => Promise.resolve({ ok: true, response: response }));
    const wrapper = mount(
      // put it under Formik to render TriggerExpressions that has Formik fields.
      // rendering TriggerExpressions also require adValues to be passed in
      <CoreContext.Provider value={{ http: httpClientMock }}>
        <Formik>
          <AnomalyDetectorTrigger
            detectorId="tempId"
            adValues={{
              anomalyGradeThresholdValue: 0.7,
              anomalyGradeThresholdEnum: 'ABOVE',
              anomalyConfidenceThresholdValue: 0.7,
              anomalyConfidenceThresholdEnum: 0.7,
            }}
            fieldPath=""
          />
        </Formik>
      </CoreContext.Provider>
    );

    expect(httpClientMock.get).toHaveBeenCalledTimes(1);
    await runAllPromises();

    // without update, we will finish mount before the embedded async AnomalyDetectorData finish mounting
    wrapper.update();

    // without update, we will finish mount before the embedded async AnomalyDetectorData finish mounting
    expect(wrapper.update().find('[data-test-subj~="empty-prompt"]').exists()).toBe(true);
    expect(wrapper.find('.euiButton__text').text()).toEqual('Enable Feature');
    expect(wrapper.update().find('[data-test-subj~="_conditionEnumField"]').exists()).toBe(false);
    expect(wrapper.update().find('[data-test-subj~="_conditionValueField"]').exists()).toBe(false);
  });
});
