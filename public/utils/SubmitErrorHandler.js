/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
/* This function is used to:
 1. call function 'onSubmitError()' when validation fails on submit
 2. auto scroll the page to the first field with error, and focus the field
 Reference: https://github.com/formium/formik/issues/1484 and https://github.com/formium/formik/issues/146 */
export const SubmitErrorHandler = (props) => {
  const errorKeys = Object.keys(dotNotate(props.errors));
  const effect = () => {
    if (errorKeys.length > 0 && !props.isSubmitting && !props.isValid) {
      props.onSubmitError();
      /* Use 2 selectors to locate the form elements. Because some elements only have 'name' attribute,
      some only have 'id' attribute, but are nested in a <div> with same the value in 'name' attribute. */
      const selector = `[id="${errorKeys[0]}"], [name="${errorKeys[0]}"]:not(div)`;
      const errorElement = document.querySelector(selector);
      if (errorElement) {
        errorElement.focus({ preventScroll: true });
        /*  Scrolling sometime doesn't work in recent versions of Chrome browser,
        unless putting it into setTimeout(). https://github.com/iamdustan/smoothscroll/issues/28 */
        setTimeout(function () {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }
  };
  useEffect(effect, [props.isSubmitting]);
  return null;
};

// convert JSON object structure to dot notation
function dotNotate(obj, target, prefix) {
  (target = target || {}), (prefix = prefix || '');

  Object.keys(obj).forEach(function (key) {
    if (obj[key] !== null && typeof obj[key] === 'object') {
      dotNotate(obj[key], target, prefix + key + '.');
    } else {
      return (target[prefix + key] = obj[key]);
    }
  });

  return target;
}
