/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, shallow, mount } from 'enzyme';
import { Formik } from 'formik';
import Message from './Message';
import Mustache from 'mustache';

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'testing-id');

function getRenderWrapper(customProps = {}) {
  return render(
    <Formik>
      {() => (
        <Message
          action={{
            message_template: {
              source:
                'Monitor {{ctx.monitor.name}} just entered alert status. Please investigate the issue.\n- Trigger: {{ctx.trigger.name}}\n- Severity: {{ctx.trigger.severity}}\n- Period start: {{ctx.periodStart}}\n- Period end: {{ctx.periodEnd}}',
              lang: 'mustache',
            },
          }}
          context={{}}
          index={0}
          sendTestMessage={jest.fn()}
          setFlyout={jest.fn()}
        />
      )}
    </Formik>
  );
}

describe('Message', () => {
  test('renders', () => {
    const wrapper = getRenderWrapper();
    expect(wrapper).toMatchSnapshot();
  });
});
