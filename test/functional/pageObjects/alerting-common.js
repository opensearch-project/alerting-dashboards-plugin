/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export function AlertingPageProvider({ getService, getPageObjects }) {
  const testSubjects = getService('testSubjects');
  const PageObjects = getPageObjects(['common']);

  return new (class AlertingPage {
    async navigate() {
      return await PageObjects.common.navigateToApp('alerting');
    }

    async navigateToMonitor() {
      return await testSubjects.click('MonitorsPage');
    }
  })();
}
