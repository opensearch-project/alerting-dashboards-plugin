/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { render, mount } from 'enzyme';
import { EuiPopover } from '@elastic/eui';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import WhereExpression from './WhereExpression';
import { FormikFieldText, FormikFieldNumber } from '../../../../../components/FormControls';
import { OPERATORS_MAP } from './utils/constants';

const dataTypes = {
  integer: new Set(['age']),
  text: new Set(['cityName']),
  keyword: new Set(['cityName.keyword']),
};
const openExpression = jest.fn();
const closeExpression = jest.fn();
const getMountWrapper = (state = false) => (
  <Formik initialValues={FORMIK_INITIAL_VALUES}>
    {(props) => (
      <WhereExpression
        formik={props}
        dataTypes={dataTypes}
        openedStates={{ WHERE: state }}
        openExpression={openExpression}
        closeExpression={closeExpression}
        onMadeChanges={jest.fn()}
      />
    )}
  </Formik>
);

describe('WhereExpression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test('renders', () => {
    expect(render(getMountWrapper())).toMatchSnapshot();
  });
  test('calls openExpression when clicking expression', () => {
    const wrapper = mount(getMountWrapper());
    const button = wrapper.find('[data-test-subj="where.addFilterButton"]').first();
    button.simulate('click');
    wrapper.update();
    expect(openExpression).toHaveBeenCalled();
  });

  // TODO: Skipping this test for now. OpenSearch-Dashboards bump the version of EUI it uses when upgrading from 1.3 to 2.0.
  //  The current version refactored the EuiPopover to handle `onKeyDown` events at the document level instead of the component level.
  //  That change breaks the functionality of this test which makes use of the `escape` key to close the popover.
  //  Manually tested this behavior May 9, 2022, and the popover closes as expected.
  //  https://github.com/opensearch-project/alerting-dashboards-plugin/issues/236
  test.skip('calls closeExpression when closing popover', () => {
    const wrapper = mount(getMountWrapper(true));
    wrapper.find(EuiPopover).simulate('keyDown', { keyCode: 27 });
    expect(closeExpression).toHaveBeenCalled();
  });

  test('should render text input for the text data types', async () => {
    const wrapper = mount(getMountWrapper(true));
    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'cityName' } })
      .simulate('keyDown', { key: 'ArrowDown' })
      .simulate('keyDown', { key: 'Enter' })
      .simulate('blur');

    wrapper.update();
    const values = wrapper.find(WhereExpression).props().formik.values;
    expect(values.where.fieldName).toEqual([{ label: 'cityName', type: 'text' }]);
    expect(values.where.operator).toEqual(OPERATORS_MAP.IS);
    expect(wrapper.find(FormikFieldText).length).toBe(1);
    expect(wrapper.find(FormikFieldNumber).length).toBe(0);
  });
});
