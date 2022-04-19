/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from 'enzyme';

import Action from './Action';
import { Formik } from 'formik';

describe('Action', () => {
  test('renders with Notifications plugin installed', () => {
    const httpClient = {
      basePath: { prepend: jest.fn() },
    };
    const context = { ctx: { monitor: {}, trigger: {} } };
    const component = (
      <Formik>
        <Action
          key={0}
          action={{}}
          arrayHelpers={{}}
          context={context}
          destinations={[]}
          flattenedDestinations={[]}
          index={0}
          onDelete={() => {}}
          sendTestMessage={() => {}}
          setFlyout={() => {}}
          httpClient={httpClient}
          fieldPath="testPath"
          values={{}}
          hasNotificationPlugin={true}
        />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });

  test('renders without Notifications plugin installed', () => {
    const httpClient = {
      basePath: { prepend: jest.fn() },
    };
    const context = { ctx: { monitor: {}, trigger: {} } };
    const component = (
      <Formik>
        <Action
          key={0}
          action={{}}
          arrayHelpers={{}}
          context={context}
          destinations={[]}
          flattenedDestinations={[]}
          index={0}
          onDelete={() => {}}
          sendTestMessage={() => {}}
          setFlyout={() => {}}
          httpClient={httpClient}
          fieldPath="testPath"
          values={{}}
          hasNotificationPlugin={false}
        />
      </Formik>
    );

    expect(render(component)).toMatchSnapshot();
  });
});
