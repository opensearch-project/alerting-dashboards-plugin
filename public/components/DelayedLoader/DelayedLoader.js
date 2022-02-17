/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';

class DelayedLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      displayLoader: false,
    };
    if (typeof props.children !== 'function') {
      throw new Error('Children should be function');
    }
  }
  componentDidMount() {
    if (this.props.isLoading) {
      this.setTimer();
    }
  }
  componentDidUpdate(prevProps) {
    const { isLoading } = this.props;
    // Setting up the loader to be visible only when network is too slow
    if (isLoading !== prevProps.isLoading) {
      if (isLoading) {
        this.setTimer();
      } else {
        this.clearTimer();
        this.setState({ displayLoader: false });
      }
    }
  }

  componentWillUnmount() {
    this.clearTimer();
  }

  clearTimer = () => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  };

  setTimer = () => {
    this.timer = setTimeout(this.handleDisplayLoader, 1000);
  };

  handleDisplayLoader = () => this.setState({ displayLoader: true });

  render() {
    const { displayLoader } = this.state;
    return this.props.children(displayLoader);
  }
}

DelayedLoader.propTypes = {
  isLoading: PropTypes.bool.isRequired,
  children: PropTypes.func.isRequired,
};

export default DelayedLoader;
