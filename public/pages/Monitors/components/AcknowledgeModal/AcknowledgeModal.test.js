/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';

import AcknowledgeModal from './AcknowledgeModal';

const alerts = [];
const totalAlerts = 0;
const onClickCancel = jest.fn();
const onAcknowledge = jest.fn();

function getShallowWrapper(customProps = {}) {
  return shallow(
    <AcknowledgeModal
      alerts={alerts}
      totalAlerts={totalAlerts}
      onClickCancel={onClickCancel}
      onAcknowledge={onAcknowledge}
      {...customProps}
    />
  );
}

describe('AcknowledgeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders', () => {
    const wrapper = getShallowWrapper();

    expect(wrapper).toMatchSnapshot();
  });

  test('renderTime returns -- for invalid times', () => {
    const renderTime = jest.spyOn(AcknowledgeModal.prototype, 'renderTime');
    const wrapper = getShallowWrapper();
    expect(wrapper.instance().renderTime(null)).toBe('--');
    expect(renderTime).toHaveBeenCalled();
  });

  test('onConfirm does not call onAcknowledge if no selectedItems', () => {
    const onConfirm = jest.spyOn(AcknowledgeModal.prototype, 'onConfirm');
    const wrapper = getShallowWrapper();
    wrapper.instance().onConfirm();
    expect(onConfirm).toHaveBeenCalled();
    expect(onAcknowledge).not.toHaveBeenCalled();
  });

  test('onConfirm calls onAcknowledge if there are selectedItems', () => {
    const onConfirm = jest.spyOn(AcknowledgeModal.prototype, 'onConfirm');
    const wrapper = getShallowWrapper();
    const selectedItems = [{ name: 'item' }];
    wrapper.setState({ selectedItems });
    wrapper.instance().onConfirm();
    expect(onConfirm).toHaveBeenCalled();
    expect(onAcknowledge).toHaveBeenCalled();
    expect(onAcknowledge).toHaveBeenCalledWith(selectedItems);
  });
});
