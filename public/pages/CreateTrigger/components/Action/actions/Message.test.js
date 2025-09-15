/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, shallow, mount } from 'enzyme';
import { Formik } from 'formik';
import Message from './Message';
import Mustache from 'mustache';
import { DEFAULT_MESSAGE_SOURCE } from '../../../utils/constants';

jest.mock('@elastic/eui/lib/components/form/form_row/make_id', () => () => 'testing-id');

function getRenderWrapper(customProps = {}) {
  return render(
    <Formik>
      {() => (
        <Message
          action={{
            message_template: {
              source: DEFAULT_MESSAGE_SOURCE.V2.QUERY_LEVEL_MONITOR,
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
