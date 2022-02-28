/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { formikToDestination } from '../formikToDestination';
import { DESTINATION_TYPE } from '../../../../utils/constants';

describe('formikToDestination', () => {
  const baseDestination = {
    name: 'testing webhook',
  };
  test('should able to build chime destination', () => {
    expect(
      formikToDestination({
        ...baseDestination,
        type: DESTINATION_TYPE.CHIME,
        [DESTINATION_TYPE.CHIME]: { url: 'https://chime.webhook' },
      })
    ).toMatchSnapshot();
  });
  test('should able to build slack destination', () => {
    expect(
      formikToDestination({
        ...baseDestination,
        type: DESTINATION_TYPE.SLACK,
        [DESTINATION_TYPE.SLACK]: { url: 'https://chime.webhook' },
      })
    ).toMatchSnapshot();
  });
  test('should able to build custom destination', () => {
    expect(
      formikToDestination({
        ...baseDestination,
        type: DESTINATION_TYPE.CUSTOM_HOOK,
        [DESTINATION_TYPE.CUSTOM_HOOK]: {
          url: 'https://custom.webhook',
          method: 'PUT',
          queryParams: [
            {
              key: 'key1',
              value: 'value1',
            },
            {
              key: 'key2',
              value: 'value2',
            },
          ],
          headerParams: [
            {
              key: 'Content-Type',
              value: 'application/json',
            },
            {
              key: 'headerKey1',
              value: 'Header Value1',
            },
            {
              key: 'headerKey2',
              value: 'Header Value2',
            },
          ],
        },
      })
    ).toMatchSnapshot();
  });
});
