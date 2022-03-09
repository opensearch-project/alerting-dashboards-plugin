/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import expect from 'expect';

export default function ({ getService, getPageObjects }) {
  // most test files will start off by loading some services
  const find = getService('find');
  const testSubjects = getService('testSubjects');
  const esArchiver = getService('esArchiver');

  const PageObjects = getPageObjects(['alertingCommon']);

  describe('Alerting Application', () => {
    before(async () => {
      await PageObjects.alertingCommon.navigate();
    });

    it('should show alerting dashboard on navigation', async () => {
      const allTexts = await testSubjects.getVisibleTextAll('appLink');
      expect(allTexts.includes('A\nAlerting')).toBe(true);
    });

    it('should navigate to Monitoring Page', async () => {
      await PageObjects.alertingCommon.navigateToMonitor();
      const currentBreadCrumb = await find.byCssSelector('.euiBreadcrumb--last');
      const currentBreadCrumbText = await currentBreadCrumb.getVisibleText();
      expect(currentBreadCrumbText).toBe('Monitors');
    });
  });
}
