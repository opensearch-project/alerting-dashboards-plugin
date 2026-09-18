/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import PplScheduleEditor from './PplScheduleEditor';

const baseProps = {
  frequency: 'interval',
  period: { interval: 1, unit: 'MINUTES' },
  cronExpression: '',
  useLookBackWindow: true,
  lookBackAmount: 1,
  lookBackUnit: 'hours',
  timestampField: '@timestamp',
  setFieldValue: jest.fn(),
  availableDateFields: ['@timestamp', 'event_time'],
  dateFieldsError: null,
  dateFieldsLoading: false,
  isMustang: false,
};

const findByTestSubj = (wrapper, subj) =>
  wrapper.findWhere((n) => n.prop('data-test-subj') === subj).first();

describe('PplScheduleEditor', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders the look back window controls (non-mustang)', () => {
    const wrapper = shallow(<PplScheduleEditor {...baseProps} />);
    expect(findByTestSubj(wrapper, 'pplUseLookBack').exists()).toBe(true);
    expect(findByTestSubj(wrapper, 'pplTimestampField').exists()).toBe(true);
  });

  test('does not render look back controls on mustang domains', () => {
    const wrapper = shallow(<PplScheduleEditor {...baseProps} isMustang={true} />);
    expect(findByTestSubj(wrapper, 'pplUseLookBack').exists()).toBe(false);
  });

  test('includes the saved timestamp field as an option even when not detected', () => {
    const wrapper = shallow(
      <PplScheduleEditor
        {...baseProps}
        timestampField="saved_ts"
        availableDateFields={['@timestamp']}
      />
    );
    const options = findByTestSubj(wrapper, 'pplTimestampField').prop('options');
    const values = options.map((o) => o.value);
    expect(values).toContain('saved_ts');
    expect(values).toContain('@timestamp');
  });

  test('does not duplicate the timestamp field when it is already detected', () => {
    const wrapper = shallow(<PplScheduleEditor {...baseProps} timestampField="event_time" />);
    const options = findByTestSubj(wrapper, 'pplTimestampField').prop('options');
    const occurrences = options.filter((o) => o.value === 'event_time').length;
    expect(occurrences).toBe(1);
  });

  test('defaults the timestamp field to the first detected field when re-enabling look back', () => {
    const setFieldValue = jest.fn();
    const wrapper = shallow(
      <PplScheduleEditor
        {...baseProps}
        setFieldValue={setFieldValue}
        useLookBackWindow={false}
        timestampField=""
        availableDateFields={['event_time', '@timestamp']}
      />
    );
    findByTestSubj(wrapper, 'pplUseLookBack').prop('onChange')({ target: { checked: true } });
    expect(setFieldValue).toHaveBeenCalledWith('useLookBackWindow', true);
    expect(setFieldValue).toHaveBeenCalledWith('timestampField', 'event_time');
  });

  test('marks the timestamp field invalid when the saved field is not among detected fields', () => {
    const wrapper = shallow(
      <PplScheduleEditor
        {...baseProps}
        timestampField="stale_field"
        availableDateFields={['@timestamp', 'event_time']}
      />
    );
    expect(findByTestSubj(wrapper, 'pplTimestampField').prop('isInvalid')).toBe(true);
  });

  test('does not mark the timestamp field invalid when the saved field is detected', () => {
    const wrapper = shallow(<PplScheduleEditor {...baseProps} timestampField="event_time" />);
    expect(findByTestSubj(wrapper, 'pplTimestampField').prop('isInvalid')).toBe(false);
  });
});
