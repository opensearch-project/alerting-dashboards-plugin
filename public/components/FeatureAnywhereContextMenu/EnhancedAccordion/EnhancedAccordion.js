import React from 'react';
import { EuiTitle, EuiSpacer, EuiButtonIcon } from '@elastic/eui';
import './styles.scss';

const EnhancedAccordion = ({ id, title, subTitle, isOpen, onToggle, children }) => (
  <div
    id={id}
    className="euiPanel euiPanel--borderRadiusMedium euiPanel--plain euiPanel--hasShadow euiPanel--hasBorder euiPanel--flexGrowZero euiSplitPanel euiSplitPanel--row euiCheckableCard"
  >
    <div className="euiPanel euiPanel--paddingMedium euiPanel--borderRadiusNone euiPanel--subdued euiPanel--noShadow euiPanel--noBorder euiPanel--flexGrowZero euiPanel--isClickable euiSplitPanel__inner">
      <EuiButtonIcon
        color="text"
        onClick={onToggle}
        iconType="arrowRight"
        aria-label="Expand"
        className={`enhanced-accordion__arrow ${isOpen ? 'enhanced-accordion__arrow--open' : ''}`}
      />
    </div>
    <div className="enhanced-accordion__title-panel euiPanel euiPanel--paddingMedium euiPanel--borderRadiusNone euiPanel--transparent euiPanel--noShadow euiPanel--noBorder euiSplitPanel__inner">
      <EuiTitle
        size="s"
        onClick={onToggle}
        role="button"
        aria-pressed={isOpen ? 'true' : 'false'}
        aria-expanded={isOpen ? 'true' : 'false'}
      >
        <h3>{title}</h3>
      </EuiTitle>
      {subTitle && (
        <>
          <EuiSpacer size="s" />
          {subTitle}
        </>
      )}
      <div className="enhanced-accordion__container-one">
        <div className="enhanced-accordion__container-two">
          <div
            className={`enhanced-accordion__content-inner ${
              isOpen ? 'enhanced-accordion__content-inner--open' : ''
            }`}
          >
            <EuiSpacer size="m" />
            {children}
            <EuiSpacer size="m" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default EnhancedAccordion;
