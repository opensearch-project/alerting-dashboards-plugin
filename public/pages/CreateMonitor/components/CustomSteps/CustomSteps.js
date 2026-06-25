/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiPanel, EuiAccordion, EuiTitle } from '@elastic/eui';
import './CustomSteps.scss';

class CustomSteps extends Component {
  render() {
    const { steps } = this.props;

    return (
      <div className="custom-steps-container">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div key={`step-${index}`} className="custom-step-wrapper">
              <div className="custom-step-number-column">
                <div className="custom-step-circle">{index + 1}</div>
                {!isLast && <div className="custom-connecting-line" />}
              </div>

              <div className="custom-step-content-column">
                <EuiPanel hasBorder paddingSize="none">
                  <EuiAccordion
                    id={`customStep-${index}`}
                    initialIsOpen={true}
                    paddingSize="none"
                    arrowDisplay="left"
                    className="create-monitor-step-panel"
                    buttonContent={
                      <div style={{ padding: '8px 0px 4px 12px' }}>
                        <EuiTitle size="s">
                          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
                            {step.title}
                          </h2>
                        </EuiTitle>
                      </div>
                    }
                  >
                    <div
                      style={{ paddingLeft: '64px', paddingRight: '16px', paddingBottom: '16px' }}
                    >
                      {step.children}
                    </div>
                  </EuiAccordion>
                </EuiPanel>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default CustomSteps;
