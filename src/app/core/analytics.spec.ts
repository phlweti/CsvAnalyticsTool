import { describe, expect, it } from 'vitest';
import { analyzeQuality, buildColumns, filteredRows, getNumericProfile, inferDataType } from './analytics';
import { Dataset, Workspace } from './models';

const rows = [
  { City: 'Bangkok', Revenue: '100', Status: 'done' },
  { City: 'Singapore', Revenue: '200', Status: 'done' },
  { City: 'Bangkok', Revenue: '100', Status: 'done' },
  { City: '', Revenue: '300', Status: 'pending' },
];

const dataset: Dataset = {
  id: 'dataset-1',
  name: 'Test',
  fileName: 'test.csv',
  fileSize: 0,
  rowCount: rows.length,
  columnCount: 3,
  columns: buildColumns(['City', 'Revenue', 'Status'], rows),
  rows,
  delimiter: ',',
  createdAt: '',
  updatedAt: '',
};

describe('dataset analytics', () => {
  it('infers numeric and boolean types while preserving unknown columns', () => {
    expect(inferDataType(['1,200', '45'])).toBe('number');
    expect(inferDataType(['yes', 'false'])).toBe('boolean');
    expect(inferDataType(['', ''])).toBe('unknown');
  });

  it('profiles numeric columns including median and percentiles', () => {
    const profile = getNumericProfile(dataset, 'Revenue');
    expect(profile).toMatchObject({ count: 4, min: 100, max: 300, sum: 700, average: 175, median: 150 });
    expect(profile.p25).toBe(100);
    expect(profile.p75).toBe(225);
  });

  it('detects missing cells and exact duplicate records', () => {
    const issues = analyzeQuality(dataset);
    expect(issues.find((issue) => issue.id === 'duplicate-rows')?.count).toBe(2);
    expect(issues.find((issue) => issue.title === 'Missing values in City')?.count).toBe(1);
  });

  it('applies all workspace filters without changing source records', () => {
    const workspace: Workspace = {
      id: 'workspace-1',
      name: 'Test workspace',
      datasetId: dataset.id,
      filters: [{ id: 'filter-1', column: 'Revenue', operator: 'greater-than', value: '100' }],
      calculatedFields: [],
      visualizations: [],
      dashboard: { id: 'dashboard-1', name: 'Dashboard', visualizationIds: [], presentationMode: false, updatedAt: '' },
      createdAt: '',
      updatedAt: '',
    };
    expect(filteredRows(dataset, workspace).map((row) => row['Revenue'])).toEqual(['200', '300']);
    expect(dataset.rows).toHaveLength(4);
  });

  it('supports text, date-range, and boolean filters', () => {
    const filterRows = (column: string, operator: Workspace['filters'][number]['operator'], value: string, sourceRows: Record<string, string>[] = rows) => {
      const source: Dataset = {
        ...dataset,
        rows: sourceRows,
        rowCount: sourceRows.length,
        columns: buildColumns(Object.keys(sourceRows[0] ?? {}), sourceRows),
      };
      const workspace: Workspace = {
        id: 'workspace-1',
        name: 'Test workspace',
        datasetId: source.id,
        filters: [{ id: 'filter-1', column, operator, value }],
        calculatedFields: [],
        visualizations: [],
        dashboard: { id: 'dashboard-1', name: 'Dashboard', visualizationIds: [], presentationMode: false, updatedAt: '' },
        createdAt: '',
        updatedAt: '',
      };
      return filteredRows(source, workspace);
    };

    expect(filterRows('City', 'starts-with', 'Bangkok').map((row) => row['City'])).toEqual(['Bangkok', 'Bangkok']);
    const datedRows = [
      { Date: '2025-03-01', Active: 'true' },
      { Date: '2025-03-15', Active: 'yes' },
      { Date: '2025-04-01', Active: 'false' },
    ];
    expect(filterRows('Date', 'between', '2025-03-01, 2025-03-31', datedRows)).toEqual(datedRows.slice(0, 2));
    expect(filterRows('Active', 'is-true', '', datedRows)).toEqual(datedRows.slice(0, 2));
  });
});
