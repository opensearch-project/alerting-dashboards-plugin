import React from 'react';
import { EuiHorizontalRule, EuiTitle, EuiAccordion, EuiSpacer, EuiPanel } from '@elastic/eui';
import './styles.scss';

function MinimalAccordion({ id, isOpen, isFirst, onToggle, title, titleAdditional, children }) {
  return (
    <div className="minimal-accordion">
      {!isFirst && (
        <>
          <EuiHorizontalRule margin="m" />
          <EuiSpacer size="xs" />
        </>
      )}
      <EuiAccordion
        id={id}
        buttonContent={
          <>
            <EuiTitle size="xxs" textTransform="uppercase">
              <h5>{title}</h5>
            </EuiTitle>
            {titleAdditional}
          </>
        }
        forceState={isOpen ? 'open' : 'closed'}
        onToggle={() => onToggle(id)}
      >
        <EuiPanel hasShadow={false} hasBorder={false}>
          {children}
        </EuiPanel>
      </EuiAccordion>
    </div>
  );
}

export default MinimalAccordion;
