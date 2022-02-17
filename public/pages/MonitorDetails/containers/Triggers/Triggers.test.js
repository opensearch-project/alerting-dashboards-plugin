/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import Triggers from './Triggers';
import { MONITOR_TYPE } from '../../../../utils/constants';
import { TRIGGER_TYPE } from '../../../CreateTrigger/containers/CreateTrigger/utils/constants';

const props = {
  monitor: {
    triggers: [{ name: 'Random Trigger', severity: 1, actions: [{ name: 'Random Action' }] }],
  },
  updateMonitor: jest.fn(),
  onEditTrigger: jest.fn(),
  onCreateTrigger: jest.fn(),
};

jest.mock('uuid/v4', () => {
  let value = 0;
  return () => value++;
});

function getShallowWrapper(customProps = {}) {
  return shallow(<Triggers {...props} {...customProps} />);
}

describe('Triggers', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });
  test('renders', () => {
    const wrapper = getShallowWrapper();

    expect(wrapper).toMatchSnapshot();
  });

  test('sets new tableKey on new monitor', () => {
    const wrapper = getShallowWrapper();
    const tableKey = wrapper.instance().state.tableKey;
    wrapper.setProps({ random: 5 });
    const sameTableKey = wrapper.instance().state.tableKey;
    expect(tableKey).toBe(sameTableKey);
    wrapper.setProps({ monitor: { ...props.monitor, name: 'New Random Monitor' } });
    const diffTableKey = wrapper.instance().state.tableKey;
    expect(tableKey).not.toBe(diffTableKey);
  });

  test('onEdit calls onEditTrigger', () => {
    const onEdit = jest.spyOn(Triggers.prototype, 'onEdit');
    const wrapper = getShallowWrapper();
    wrapper.instance().onEdit();
    expect(onEdit).toHaveBeenCalled();
    expect(props.onEditTrigger).toHaveBeenCalled();
  });

  test('onDelete calls updateMonitor with triggers to keep', () => {
    const onDelete = jest.spyOn(Triggers.prototype, 'onDelete');
    const monitor = {
      monitor_type: MONITOR_TYPE.QUERY_LEVEL,
      triggers: [
        {
          [TRIGGER_TYPE.QUERY_LEVEL]: {
            name: 'one',
            severity: 1,
            actions: [{ name: 'one action' }],
          },
        },
        {
          [TRIGGER_TYPE.QUERY_LEVEL]: {
            name: 'two',
            severity: 2,
            actions: [{ name: 'two action' }],
          },
        },
      ],
    };
    const wrapper = getShallowWrapper({ monitor });
    wrapper.setState({ selectedItems: [monitor.triggers[0][TRIGGER_TYPE.QUERY_LEVEL]] });
    wrapper.instance().onDelete();
    expect(onDelete).toHaveBeenCalled();
    expect(props.updateMonitor).toHaveBeenCalled();
    expect(props.updateMonitor).toHaveBeenCalledWith({
      triggers: [monitor.triggers[1][TRIGGER_TYPE.QUERY_LEVEL]],
    });
  });
});
