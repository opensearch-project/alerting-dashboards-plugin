/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreQueryLike, isExploreQueryMonitorable } from './explore_create_monitor_gate';
const ppl = (dataset: ExploreQueryLike['dataset']): ExploreQueryLike => ({
  language: 'PPL',
  dataset,
});

describe('isExploreQueryMonitorable', () => {
  it('accepts PPL on index patterns and indexes of the local cluster', () => {
    expect(isExploreQueryMonitorable(ppl({ type: 'INDEX_PATTERN' }))).toBe(true);
    expect(
      isExploreQueryMonitorable(
        ppl({ type: 'INDEXES', dataSource: { id: '', type: 'DATA_SOURCE' } })
      )
    ).toBe(true);
  });

  it('accepts PPL on an OpenSearch data source, whichever field carries the engine', () => {
    expect(
      isExploreQueryMonitorable(
        ppl({ type: 'INDEX_PATTERN', dataSource: { id: 'ds', type: 'OpenSearch' } })
      )
    ).toBe(true);
    expect(
      isExploreQueryMonitorable(
        ppl({
          type: 'INDEXES',
          dataSource: { id: 'ds', type: 'DATA_SOURCE', engineType: 'OpenSearch' },
        })
      )
    ).toBe(true);
    // Saved before engine detection.
    expect(
      isExploreQueryMonitorable(
        ppl({ type: 'INDEXES', dataSource: { id: 'ds', type: 'DATA_SOURCE' } })
      )
    ).toBe(true);
    expect(
      isExploreQueryMonitorable(
        ppl({ type: 'INDEX_PATTERN', dataSource: { id: 'ds', type: 'No Engine Type Available' } })
      )
    ).toBe(true);
  });

  it('matches the language case-insensitively', () => {
    expect(isExploreQueryMonitorable({ language: 'ppl', dataset: { type: 'INDEX_PATTERN' } })).toBe(
      true
    );
  });

  it('rejects other languages on index datasets', () => {
    for (const language of ['kuery', 'lucene', 'SQL', undefined]) {
      expect(isExploreQueryMonitorable({ language, dataset: { type: 'INDEX_PATTERN' } })).toBe(
        false
      );
    }
  });

  it('rejects datasets other plugins add, whatever their language', () => {
    expect(isExploreQueryMonitorable({ language: 'PROMQL', dataset: { type: 'PROMETHEUS' } })).toBe(
      false
    );
    expect(isExploreQueryMonitorable(ppl({ type: 'SOME_EXTERNAL_SOURCE' }))).toBe(false);
    expect(isExploreQueryMonitorable(ppl({}))).toBe(false);
    expect(isExploreQueryMonitorable(undefined)).toBe(false);
  });

  it('rejects data sources whose engine is not OpenSearch', () => {
    expect(
      isExploreQueryMonitorable(
        ppl({
          type: 'INDEXES',
          dataSource: { id: 'ds', type: 'DATA_SOURCE', engineType: 'Elasticsearch' },
        })
      )
    ).toBe(false);
  });
  it('accepts PPL on AnalyticEngine data sources (pluggable data format domains)', () => {
    expect(
      isExploreQueryMonitorable(
        ppl({
          type: 'INDEXES',
          dataSource: { id: 'ds', type: 'DATA_SOURCE', engineType: 'AnalyticEngine' },
        })
      )
    ).toBe(true);
    expect(
      isExploreQueryMonitorable(
        ppl({ type: 'INDEX_PATTERN', dataSource: { id: 'ds', type: 'AnalyticEngine' } })
      )
    ).toBe(true);
  });

  // The dataset's version is the saved object's, recorded at registration and not refreshed after
  // an upgrade, so the gate doesn't use it: a stale 2.x version must not hide the action.
  it('ignores the data source version', () => {
    for (const version of ['2.19.0', '3.4.1', '3.5.0', undefined]) {
      expect(
        isExploreQueryMonitorable(
          ppl({ type: 'INDEX_PATTERN', dataSource: { id: 'ds', type: 'OpenSearch', version } })
        )
      ).toBe(true);
    }
  });
});
