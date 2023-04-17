/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Formik } from 'formik';
import { mount, render } from 'enzyme';
import { EuiPopover } from '@elastic/eui';

import { FORMIK_INITIAL_VALUES } from '../../../containers/CreateMonitor/utils/constants';
import WhereExpression, { MAX_NUM_WHERE_EXPRESSION } from './WhereExpression';
import { FormikFieldNumber, FormikFieldText } from '../../../../../components/FormControls';
import { OPERATORS_MAP } from './utils/constants';
import { TRIGGER_OPERATORS_MAP } from '../../../../CreateTrigger/containers/DefineBucketLevelTrigger/DefineBucketLevelTrigger';

const dataTypes = {
  integer: new Set(['age']),
  text: new Set(['cityName']),
  keyword: new Set(['cityName.keyword']),
};
const openExpression = jest.fn();
const closeExpression = jest.fn();
const getMountWrapper = (state = false, useTriggerFieldOperators = false) => (
  <Formik initialValues={FORMIK_INITIAL_VALUES}>
    {(props) => (
      <WhereExpression
        formik={props}
        dataTypes={dataTypes}
        openedStates={{ WHERE: state }}
        openExpression={openExpression}
        closeExpression={closeExpression}
        onMadeChanges={jest.fn()}
        useTriggerFieldOperators={useTriggerFieldOperators}
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
    const button = wrapper.find('[data-test-subj="addFilterButton"]').first();
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
    wrapper.find('[data-test-subj="addFilterButton"]').hostNodes().simulate('click');

    wrapper
      .find('[data-test-subj="comboBoxSearchInput"]')
      .hostNodes()
      .simulate('change', { target: { value: 'cityName' } })
      .simulate('keyDown', { key: 'ArrowDown' })
      .simulate('keyDown', { key: 'Enter' })
      .simulate('blur');

    wrapper.update();
    const values = wrapper.find(WhereExpression).props().formik.values;
    expect(values.filters[0].fieldName).toEqual([{ label: 'cityName', type: 'text' }]);
    expect(values.filters[0].operator).toEqual(OPERATORS_MAP.IS.value);
    expect(wrapper.find(FormikFieldText).length).toBe(1);
    expect(wrapper.find(FormikFieldNumber).length).toBe(0);
  });

  test(`monitor queries should support up to ${MAX_NUM_WHERE_EXPRESSION.DATA_FILTERS} data filters`, async () => {
    const wrapper = mount(getMountWrapper(true, false));

    for (let i = 0; i < MAX_NUM_WHERE_EXPRESSION.DATA_FILTERS; i++) {
      const newEntry = `cityName${i}`;
      dataTypes.text.add(newEntry);
      wrapper.find('[data-test-subj="addFilterButton"]').hostNodes().simulate('click');
      wrapper
        .find('[data-test-subj="comboBoxSearchInput"]')
        .hostNodes()
        .last()
        .simulate('change', { target: { value: newEntry } })
        .simulate('keyDown', { key: 'ArrowDown' })
        .simulate('keyDown', { key: 'Enter' })
        .simulate('blur');
      wrapper.update();
    }

    const values = wrapper.find(WhereExpression).props().formik.values;
    for (let i = 0; i < MAX_NUM_WHERE_EXPRESSION.DATA_FILTERS; i++) {
      expect(values.filters[i].fieldName).toEqual([{ label: `cityName${i}`, type: 'text' }]);
      expect(values.filters[i].operator).toEqual(OPERATORS_MAP.IS.value);
    }
    expect(wrapper.find(FormikFieldText).length).toBe(MAX_NUM_WHERE_EXPRESSION.DATA_FILTERS);
    expect(wrapper.find(FormikFieldNumber).length).toBe(0);
    expect(wrapper.find('euiButtonEmpty__text').exists()).toBe(false);
  });

  test(`bucket level triggers should support up to ${MAX_NUM_WHERE_EXPRESSION.KEYWORD_FILTERS} keyword filters`, async () => {
    const wrapper = mount(getMountWrapper(true, true));

    for (let i = 0; i < MAX_NUM_WHERE_EXPRESSION.KEYWORD_FILTERS; i++) {
      const newEntry = `cityName${i}.keyword`;
      dataTypes.keyword.add(newEntry);
      wrapper.find('[data-test-subj="addFilterButton"]').hostNodes().simulate('click');
      wrapper
        .find('[data-test-subj="comboBoxSearchInput"]')
        .hostNodes()
        .last()
        .simulate('change', { target: { value: newEntry } })
        .simulate('keyDown', { key: 'ArrowDown' })
        .simulate('keyDown', { key: 'Enter' })
        .simulate('blur');
      wrapper.update();
    }

    const values = wrapper.find(WhereExpression).props().formik.values;
    for (let i = 0; i < MAX_NUM_WHERE_EXPRESSION.KEYWORD_FILTERS; i++) {
      expect(values.filters[i].fieldName).toEqual([
        { label: `cityName${i}.keyword`, type: 'keyword' },
      ]);
      expect(values.filters[i].operator).toEqual(TRIGGER_OPERATORS_MAP.INCLUDE);
    }
    expect(wrapper.find(FormikFieldText).length).toBe(MAX_NUM_WHERE_EXPRESSION.KEYWORD_FILTERS);
    expect(wrapper.find(FormikFieldNumber).length).toBe(0);
    expect(wrapper.find('.euiButtonEmpty__text').exists()).toBe(false);
  });
});
