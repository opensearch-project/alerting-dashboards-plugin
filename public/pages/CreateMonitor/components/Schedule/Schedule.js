/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Fragment } from 'react';
import { EuiSpacer, EuiText } from '@elastic/eui';
import { Frequency, FrequencyPicker } from './Frequencies';
import Interval from './Frequencies/Interval';

const Schedule = ({ isAd, flyoutMode }) => (
  <Fragment>
    {!flyoutMode && (
      <EuiText style={{ marginBottom: '0px' }}>
        <h4>Schedule</h4>
      </EuiText>
    )}

    {isAd && !flyoutMode ? (
      <EuiText color={'subdued'} size={'xs'} style={{ maxWidth: '400px' }}>
        <p>
          Define how often the monitor collects data and how often you may receive alerts. We
          recommend setting this frequency to two times the detector interval to avoid missing
          anomalous results from delayed processing time.
        </p>
      </EuiText>
    ) : null}

    {!flyoutMode && <EuiSpacer size="m" />}
    <div style={{ maxWidth: '400px' }}>
      {isAd ? (
        <Interval />
      ) : (
        <div>
          <Frequency flyoutMode={flyoutMode} />
          <EuiSpacer size={flyoutMode ? 'm' : 's'} />
          <FrequencyPicker />
        </div>
      )}
    </div>
  </Fragment>
);

export default Schedule;
