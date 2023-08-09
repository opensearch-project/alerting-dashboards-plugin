/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';
import PropTypes from 'prop-types';

export const RelatedMonitors = ({ links, onShowAll }) => {
  const [truncateList, setShouldTruncateList] = useState(false);
  const [nodeRef, setNodeRef] = useState(null);

  const updateNodeRef = useCallback((node) => {
    setNodeRef(node);
    updateTruncationStatus(node);
  }, []);

  const updateTruncationStatus = (node) => {
    if (!node) {
      return;
    }

    const contentWidth = Array.from(node.children).reduce(
      (width, curr) => width + curr.clientWidth,
      0
    );
    const containerWidth = node.parentElement.clientWidth;
    setShouldTruncateList(contentWidth > containerWidth);
  };

  useEffect(() => {
    const updateCallback = () => {
      updateTruncationStatus(nodeRef);
    };

    window.addEventListener('resize', updateCallback);

    return () => window.removeEventListener('resize', updateCallback);
  }, [nodeRef]);

  return (
    <div style={{ position: 'relative' }}>
      <EuiFlexGroup gutterSize="xs" ref={updateNodeRef} responsive={false}>
        {links.map(({ name, href, onClick }, idx) => {
          const linkProps = href ? { href } : { onClick };
          return (
            <EuiFlexItem grow={false} style={{ flexShrink: 0 }}>
              <EuiLink {...linkProps} className="related-monitor-link" target="_blank">
                {name}
                {`${idx < links.length - 1 ? ', ' : ''}`}
              </EuiLink>
            </EuiFlexItem>
          );
        })}
      </EuiFlexGroup>
      {truncateList && (
        <div style={{ position: 'absolute', right: 0, top: 0 }}>
          <span
            style={{
              background: 'white',
              padding: `2px 10px`,
              fontWeight: 800,
              letterSpacing: 3,
              fontSize: 16,
            }}
          >
            ...
          </span>
          <EuiBadge color="primary" onClick={onShowAll}>{`View all ${links.length}`}</EuiBadge>
        </div>
      )}
    </div>
  );
};

RelatedMonitors.propTypes = {
  links: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      href: PropTypes.string,
      onClick: PropTypes.func,
    })
  ).isRequired,
};
