/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import {
  getFindingsForMonitor,
  parseFindingsForPreview,
  QUERY_OPERATORS,
  validDocLevelGraphQueries,
} from './findingsUtils';

describe('findingsUtils', () => {
  describe('getFindingsForMonitor', () => {
    test('when findings array is empty', () => {
      const findings = [];
      const monitorId = 'monitorId';
      const expectedOutput = { findings: [], totalFindings: 0 };
      expect(getFindingsForMonitor(findings, monitorId)).toEqual(expectedOutput);
    });

    test('when findings array is undefined', () => {
      const findings = undefined;
      const monitorId = 'monitorId';
      const expectedOutput = { findings: [], totalFindings: 0 };
      expect(getFindingsForMonitor(findings, monitorId)).toEqual(expectedOutput);
    });

    describe('when findings array contains findings and', () => {
      const findings = [
        {
          finding1: {
            finding: {
              id: 'finding1',
              monitor_id: 'monitorId1',
            },
            document_list: ['doc1'],
          },
        },
        {
          finding2: {
            finding: {
              id: 'finding2',
              monitor_id: 'monitorId2',
            },
            document_list: ['doc2'],
          },
        },
        {
          finding3: {
            finding: {
              id: 'finding3',
              monitor_id: 'monitorId2',
            },
            document_list: ['doc3'],
          },
        },
        {
          finding4: {
            finding: {
              id: 'finding4',
              monitor_id: 'monitorId2',
            },
            document_list: ['doc4'],
          },
        },
      ];

      test('when monitorId is blank', () => {
        const monitorId = '';
        const expectedOutput = { findings: [], totalFindings: 0 };
        expect(getFindingsForMonitor(findings, monitorId)).toEqual(expectedOutput);
      });

      test('when monitorId is undefined', () => {
        const monitorId = undefined;
        const expectedOutput = { findings: [], totalFindings: 0 };
        expect(getFindingsForMonitor(findings, monitorId)).toEqual(expectedOutput);
      });

      test('when monitorId has matching findings', () => {
        const monitorId = 'monitorId2';
        const expectedOutput = {
          findings: [
            {
              id: 'finding2',
              monitor_id: 'monitorId2',
              document_list: ['doc2'],
            },
            {
              id: 'finding3',
              monitor_id: 'monitorId2',
              document_list: ['doc3'],
            },
            {
              id: 'finding4',
              monitor_id: 'monitorId2',
              document_list: ['doc4'],
            },
          ],
          totalFindings: 3,
        };
        const output = getFindingsForMonitor(findings, monitorId);
        expect(output).toEqual(expectedOutput);
      });

      test('when monitorId has no matching findings', () => {
        const monitorId = 'unknownMonitorId';
        const expectedOutput = { findings: [], totalFindings: 0 };
        expect(getFindingsForMonitor(findings, monitorId)).toEqual(expectedOutput);
      });
    });
  });

  describe('parseFindingsForPreview', () => {
    const index = 'indexName';
    describe('when previewResponse contains no results and', () => {
      const previewResponse = {};

      test('when there are no queries', () => {
        const queries = [];
        const expectedOutput = [];
        expect(parseFindingsForPreview(previewResponse, index, queries)).toEqual(expectedOutput);
      });

      test('when there are no matching queries', () => {
        const queries = [
          {
            id: 'unknownQuery1',
            queryName: 'unknownQuery1',
            field: 'field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value1',
            tags: ['tag1', 'tag2'],
          },
          {
            id: 'unknownQuery2',
            queryName: 'unknownQuery2',
            field: 'another.field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value2',
            tags: ['tag3'],
          },
        ];
        const expectedOutput = [];
        expect(parseFindingsForPreview(previewResponse, index, queries)).toEqual(expectedOutput);
      });
    });

    describe('when previewResponse contains results and', () => {
      const previewResponse = {
        query1: ['docId1', 'docId2', 'docId3'],
        query2: ['docId4', 'docId5', 'docId6'],
      };

      test('when there are no queries', () => {
        const queries = [];
        const expectedOutput = [];
        expect(parseFindingsForPreview(previewResponse, index, queries)).toEqual(expectedOutput);
      });

      test('when there are no matching queries', () => {
        const queries = [
          {
            id: 'unknownQuery1',
            queryName: 'unknownQuery1',
            field: 'field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value1',
            tags: ['tag1', 'tag2'],
          },
          {
            id: 'unknownQuery2',
            queryName: 'unknownQuery2',
            field: 'another.field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value2',
            tags: ['tag3'],
          },
        ];
        const expectedOutput = [];
        expect(parseFindingsForPreview(previewResponse, index, queries)).toEqual(expectedOutput);
      });

      test('when there are matching queries', () => {
        const queries = [
          {
            id: 'unknownQuery1',
            queryName: 'unknownQuery1',
            field: 'field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value1',
            tags: ['tag1', 'tag2'],
          },
          {
            id: 'query2',
            queryName: 'query2',
            field: 'another.field.name',
            operator: QUERY_OPERATORS[0].value,
            query: 'value2',
            tags: ['tag3'],
          },
        ];

        const expectedOutput = [
          {
            index: index,
            related_doc_id: 'docId4',
            queries: [{ name: 'query2', query: 'another.field.name is value2' }],
            timestamp: '',
          },
          {
            index: index,
            related_doc_id: 'docId5',
            queries: [{ name: 'query2', query: 'another.field.name is value2' }],
            timestamp: '',
          },
          {
            index: index,
            related_doc_id: 'docId6',
            queries: [{ name: 'query2', query: 'another.field.name is value2' }],
            timestamp: '',
          },
        ];
        const output = parseFindingsForPreview(previewResponse, index, queries);
        expectedOutput.forEach((expectedQuery) => {
          const matchingQuery = _.find(output, {
            index: expectedQuery.index,
            queries: expectedQuery.queries,
            related_doc_id: expectedQuery.related_doc_id,
          });
          expect(_.isEmpty(matchingQuery)).toEqual(false);
        });
        expect(output.length).toEqual(expectedOutput.length);
      });
    });
  });

  describe('validDocLevelGraphQueries', () => {
    test('when no queries are supplied', () => {
      const queries = [];
      expect(validDocLevelGraphQueries(queries)).toEqual(false);
    });

    test('when a query does not have a queryName value', () => {
      const queries = [
        {
          id: 'query1',
          queryName: '',
          field: 'field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value1',
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'query2',
          queryName: 'query2',
          field: 'another.field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value2',
          tags: ['tag3'],
        },
      ];
      expect(validDocLevelGraphQueries(queries)).toEqual(false);
    });

    test('when a query does not have a field value', () => {
      const queries = [
        {
          id: 'query1',
          queryName: 'query2',
          field: '',
          operator: QUERY_OPERATORS[0].value,
          query: 'value1',
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'query2',
          queryName: 'query2',
          field: 'another.field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value2',
          tags: ['tag3'],
        },
      ];
      expect(validDocLevelGraphQueries(queries)).toEqual(false);
    });

    test('when a query does not have an operator value', () => {
      const queries = [
        {
          id: 'query1',
          queryName: 'query2',
          field: 'field.name',
          operator: '',
          query: 'value1',
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'query2',
          queryName: 'query2',
          field: 'another.field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value2',
          tags: ['tag3'],
        },
      ];
      expect(validDocLevelGraphQueries(queries)).toEqual(false);
    });

    test('when a query does not have a query value', () => {
      const queries = [
        {
          id: 'query1',
          queryName: 'query1',
          field: 'field.name',
          operator: QUERY_OPERATORS[0].value,
          query: '',
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'query2',
          queryName: 'query2',
          field: 'another.field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value2',
          tags: ['tag3'],
        },
      ];
      expect(validDocLevelGraphQueries(queries)).toEqual(false);
    });

    test('when all queries are defined', () => {
      const queries = [
        {
          id: 'query1',
          queryName: 'query2',
          field: 'field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value1',
          tags: ['tag1', 'tag2'],
        },
        {
          id: 'query2',
          queryName: 'query2',
          field: 'another.field.name',
          operator: QUERY_OPERATORS[0].value,
          query: 'value2',
          tags: ['tag3'],
        },
      ];
      expect(validDocLevelGraphQueries(queries)).toEqual(true);
    });
  });
});
