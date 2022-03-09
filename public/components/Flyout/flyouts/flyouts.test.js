/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Flyouts from './index';

describe('Flyouts.message', () => {
  test('generates message JSON', () => {
    const json = Flyouts.message();
    expect(json).toMatchSnapshot();
  });
});

describe('Flyouts.messageFrequency', () => {
  test('generates message JSON', () => {
    const json = Flyouts.messageFrequency();
    expect(json).toMatchSnapshot();
  });
});

describe('Flyouts.triggerCondition', () => {
  test('generates message JSON', () => {
    const json = Flyouts.triggerCondition({});
    expect(json).toMatchSnapshot();
  });
});

describe('Flyouts.alertsDashboard', () => {
  test('generates message JSON', () => {
    const json = Flyouts.alertsDashboard({});
    expect(json).toMatchSnapshot();
  });
});
