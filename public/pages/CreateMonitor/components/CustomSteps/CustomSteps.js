/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiPanel, EuiAccordion, EuiTitle } from '@elastic/eui';
import './CustomSteps.scss';

class CustomSteps extends Component {
  constructor(props) {
    super(props);
    this.stepRefs = {};
    this.state = {
      lineHeights: {}
    };
  }

  componentDidMount() {
    // Calculate line heights once at startup
    setTimeout(() => {
      this.updateLineHeights();
    }, 100);
  }

  updateLineHeights = () => {
    const { steps } = this.props;
    const newLineHeights = {};
    
    for (let i = 0; i < steps.length - 1; i++) {
      const currentRef = this.stepRefs[`step-${i}`];
      const nextRef = this.stepRefs[`step-${i + 1}`];
      
      if (currentRef && nextRef) {
        const currentCircle = currentRef.querySelector('.custom-step-circle');
        const nextCircle = nextRef.querySelector('.custom-step-circle');
        
        if (currentCircle && nextCircle) {
          const currentRect = currentCircle.getBoundingClientRect();
          const nextRect = nextCircle.getBoundingClientRect();
          
          const distance = nextRect.top - currentRect.bottom;
          newLineHeights[`line-${i}`] = Math.max(distance, 20); // Minimum 20px
        }
      }
    }
    
    this.setState({ lineHeights: newLineHeights });
  };

  // Remove the handleAccordionToggle method since we don't want to recalculate

  render() {
    const { steps } = this.props;
    const { lineHeights } = this.state;
    
    return (
      <div className="custom-steps-container">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const lineHeight = lineHeights[`line-${index}`] || 100; // Default fallback
          
          return (
            <div 
              key={`step-${index}`}
              className="custom-step-wrapper"
              ref={(el) => { this.stepRefs[`step-${index}`] = el; }}
            >
              <div className="custom-step-number-column">
                <div className="custom-step-circle">
                  {index + 1}
                </div>
                {!isLast && (
                  <div 
                    className="custom-connecting-line"
                    style={{ height: `${lineHeight}px` }}
                  />
                )}
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
                    <div style={{ paddingLeft: '64px', paddingRight: '16px', paddingBottom: '16px' }}>
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
