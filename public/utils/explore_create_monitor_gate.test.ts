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

  it('rejects an engine too old for PPL monitors, when the version is known', () => {
    const on = (version?: string) =>
      isExploreQueryMonitorable(
        ppl({ type: 'INDEX_PATTERN', dataSource: { id: 'ds', type: 'OpenSearch', version } })
      );
    expect(on('3.4.1')).toBe(false);
    expect(on('2.19.0')).toBe(false);
    expect(on('3.5.0')).toBe(true);
    expect(on('3.10.0-SNAPSHOT')).toBe(true);
    // Unknown: the capability alone decides, as in the Alerting app.
    expect(on(undefined)).toBe(true);
  });
});
