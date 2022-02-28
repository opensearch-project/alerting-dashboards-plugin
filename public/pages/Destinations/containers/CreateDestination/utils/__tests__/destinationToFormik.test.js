/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { destinationToFormik } from '../destinationToFormik';
import { DESTINATION_TYPE } from '../../../../utils/constants';
import { httpClientMock } from '../../../../../../../test/mocks';

describe('destinationToFormik', () => {
  const baseDestination = {
    id: 'destination_id',
    name: 'testing webhook',
    last_update_time: 1548708549982,
    version: 2,
  };
  test('should able to convert chime destination to Formik object', async () => {
    expect(
      await destinationToFormik(httpClientMock, {
        ...baseDestination,
        type: DESTINATION_TYPE.CHIME,
        [DESTINATION_TYPE.CHIME]: { url: 'https://chime.webhook' },
      })
    ).toMatchSnapshot();
  });
  test('should able to convert slack destination to Formik object', async () => {
    expect(
      await destinationToFormik(httpClientMock, {
        ...baseDestination,
        type: DESTINATION_TYPE.SLACK,
        [DESTINATION_TYPE.SLACK]: { url: 'https://chime.webhook' },
      })
    ).toMatchSnapshot();
  });
  test('should able to convert custom destination to Formik object', async () => {
    expect(
      await destinationToFormik(httpClientMock, {
        ...baseDestination,
        type: DESTINATION_TYPE.CUSTOM_HOOK,
        [DESTINATION_TYPE.CUSTOM_HOOK]: {
          url: 'https://custom.webhook',
          port: -1,
          method: 'PUT',
          query_params: { key1: 'value1', key2: 'Value2' },
          header_params: {
            'Content-Type': 'application/json',
            headerKey1: 'headerValue',
            headerKey2: 'headerValue2',
          },
        },
      })
    ).toMatchSnapshot();
  });
  test('should able to convert custom destination (with port) to Formik object', async () => {
    expect(
      await destinationToFormik(httpClientMock, {
        ...baseDestination,
        type: DESTINATION_TYPE.CUSTOM_HOOK,
        [DESTINATION_TYPE.CUSTOM_HOOK]: {
          url: 'https://custom.webhook',
          port: 8888,
          method: 'PUT',
          query_params: { key1: 'value1', key2: 'Value2' },
          header_params: {
            'Content-Type': 'application/json',
            headerKey1: 'headerValue',
            headerKey2: 'headerValue2',
          },
        },
      })
    ).toMatchSnapshot();
  });
  test('should able to convert custom destination (with custom attributes) to Formik object', async () => {
    expect(
      await destinationToFormik(httpClientMock, {
        ...baseDestination,
        type: DESTINATION_TYPE.CUSTOM_HOOK,
        [DESTINATION_TYPE.CUSTOM_HOOK]: {
          host: 'https://custom.webhook',
          port: 80,
          path: '/my_custom_path',
          method: 'PUT',
          query_params: { key1: 'value1', key2: 'Value2' },
          header_params: {
            'Content-Type': 'application/json',
            headerKey1: 'headerValue',
            headerKey2: 'headerValue2',
          },
        },
      })
    ).toMatchSnapshot();
  });
});
