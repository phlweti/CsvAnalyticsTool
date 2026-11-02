import { Dataset, DatasetColumn, DataType, NumericProfile, QualityIssue, Workspace } from './models';

const isEmpty = (value: string | null | undefined): boolean => value == null || value.trim() === '';

export function inferDataType(values: string[]): DataType {
  const present = values.filter((value) => !isEmpty(value));
  if (!present.length) return 'unknown';

  const normalized = present.map((value) => value.trim().toLowerCase());
  if (normalized.every((value) => ['true', 'false', 'yes', 'no'].includes(value))) return 'boolean';

  const numbers = present.map((value) => Number(value.replace(/,/g, '')));
  if (numbers.every(Number.isFinite)) return 'number';

  const dates = present.map((value) => Date.parse(value));
  if (dates.every(Number.isFinite) && present.some((value) => /[-/]|T\d/.test(value))) {
    return present.some((value) => /T\d|:\d{2}/.test(value)) ? 'datetime' : 'date';
  }
  return 'string';
}

export function buildColumns(headers: string[], rows: Record<string, string>[]): DatasetColumn[] {
  return headers.map((name, index) => {
    const values = rows.map((row) => row[name] ?? '');
    return {
      id: `column-${index}`,
      name,
      dataType: inferDataType(values),
      nullable: values.some(isEmpty),
      uniqueCount: new Set(values.filter((value) => !isEmpty(value))).size,
      missingCount: values.filter(isEmpty).length,
    };
  });
}

export function getNumericProfile(dataset: Dataset, column: string, rows = dataset.rows): NumericProfile {
  const values = rows
    .map((row) => Number((row[column] ?? '').replace(/,/g, '')))
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  const quantile = (fraction: number): number => {
    if (!values.length) return 0;
    const position = (values.length - 1) * fraction;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    return values[lower] + (values[upper] - values[lower]) * (position - lower);
  };
  const average = values.length ? sum / values.length : 0;
  const variance = values.length
    ? values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length
    : 0;

  return {
    count: values.length,
    missing: rows.length - values.length,
    unique: new Set(values).size,
    min: values[0] ?? 0,
    max: values.at(-1) ?? 0,
    sum,
    average,
    median: quantile(0.5),
    standardDeviation: Math.sqrt(variance),
    p25: quantile(0.25),
    p75: quantile(0.75),
  };
}

export function filteredRows(dataset: Dataset, workspace?: Workspace): Record<string, string>[] {
  if (!workspace?.filters.length) return dataset.rows;
  return dataset.rows.filter((row) =>
    workspace.filters.every((filter) => {
      const value = row[filter.column] ?? '';
      const number = Number(value.replace(/,/g, ''));
      const expected = Number(filter.value);
      const date = Date.parse(value);
      const expectedDate = Date.parse(filter.value);
      switch (filter.operator) {
        case 'contains':
          return value.toLowerCase().includes(filter.value.toLowerCase());
        case 'does-not-contain':
          return !value.toLowerCase().includes(filter.value.toLowerCase());
        case 'equals':
          return value.toLowerCase() === filter.value.toLowerCase();
        case 'does-not-equal':
          return value.toLowerCase() !== filter.value.toLowerCase();
        case 'starts-with':
          return value.toLowerCase().startsWith(filter.value.toLowerCase());
        case 'ends-with':
          return value.toLowerCase().endsWith(filter.value.toLowerCase());
        case 'greater-than':
          return Number.isFinite(number) && number > expected;
        case 'greater-or-equal':
          return Number.isFinite(number) && number >= expected;
        case 'less-than':
          return Number.isFinite(number) && number < expected;
        case 'less-or-equal':
          return Number.isFinite(number) && number <= expected;
        case 'between': {
          const [lowerValue, upperValue] = filter.value.split(',').map((part) => part.trim());
          const lower = Number(lowerValue);
          const upper = Number(upperValue);
          if (Number.isFinite(number) && Number.isFinite(lower) && Number.isFinite(upper)) {
            return number >= lower && number <= upper;
          }
          const lowerDate = Date.parse(lowerValue);
          const upperDate = Date.parse(upperValue);
          if (!Number.isFinite(date) || !Number.isFinite(lowerDate) || !Number.isFinite(upperDate)) return false;
          const exclusiveUpper = /^\d{4}-\d{2}-\d{2}$/.test(upperValue) ? upperDate + 86_400_000 : upperDate + 1;
          return date >= lowerDate && date < exclusiveUpper;
        }
        case 'before':
          return Number.isFinite(date) && Number.isFinite(expectedDate) && date < expectedDate;
        case 'after':
          return Number.isFinite(date) && Number.isFinite(expectedDate) && date > expectedDate;
        case 'on':
          return Number.isFinite(date) && Number.isFinite(expectedDate) && new Date(date).toISOString().slice(0, 10) === new Date(expectedDate).toISOString().slice(0, 10);
        case 'is-true':
          return ['true', 'yes'].includes(value.trim().toLowerCase());
        case 'is-false':
          return ['false', 'no'].includes(value.trim().toLowerCase());
        case 'is-empty':
          return isEmpty(value);
        case 'is-not-empty':
          return !isEmpty(value);
      }
    }),
  );
}

export function analyzeQuality(dataset: Dataset): QualityIssue[] {
  const issues: QualityIssue[] = [];
  const duplicateRows = new Map<string, number[]>();
  dataset.rows.forEach((row, index) => {
    const key = JSON.stringify(dataset.columns.map(({ name }) => row[name] ?? ''));
    const indexes = duplicateRows.get(key);
    if (indexes) indexes.push(index);
    else duplicateRows.set(key, [index]);
  });
  const duplicateIndexes = [...duplicateRows.values()].filter((indexes) => indexes.length > 1).flat();
  if (duplicateIndexes.length) {
    issues.push({
      id: 'duplicate-rows',
      title: 'Duplicate rows',
      description: 'Rows with identical values across every column.',
      severity: 'medium',
      count: duplicateIndexes.length,
      rows: duplicateIndexes,
    });
  }

  for (const column of dataset.columns) {
    const values = dataset.rows.map((row) => row[column.name] ?? '');
    const missingRows = values.flatMap((value, index) => (isEmpty(value) ? [index] : []));
    if (missingRows.length) {
      issues.push({
        id: `missing-${column.id}`,
        title: `Missing values in ${column.name}`,
        description: `${missingRows.length.toLocaleString()} records have no value in this column.`,
        severity: missingRows.length > dataset.rowCount * 0.1 ? 'high' : 'medium',
        count: missingRows.length,
        column: column.name,
        rows: missingRows,
      });
    }

    const present = values.filter((value) => !isEmpty(value));
    const numberValues = present.filter((value) => Number.isFinite(Number(value.replace(/,/g, ''))));
    const booleanValues = present.filter((value) => ['true', 'false', 'yes', 'no'].includes(value.trim().toLowerCase()));
    const dateValues = present.filter((value) => Number.isFinite(Date.parse(value)) && /[-/]|T\d/.test(value));
    const hasMixedTypes = [numberValues, booleanValues, dateValues].some(
      (candidates) => candidates.length > 0 && candidates.length < present.length,
    );
    if (hasMixedTypes) {
      const expected = [numberValues, booleanValues, dateValues]
        .sort((a, b) => b.length - a.length)[0];
      const invalid = values.flatMap((value, index) =>
        !isEmpty(value) && !expected.includes(value) ? [index] : [],
      );
      issues.push({
        id: `mixed-${column.id}`,
        title: `Mixed data types in ${column.name}`,
        description: 'Values in this column do not use a consistent data type.',
        severity: 'medium',
        count: invalid.length,
        column: column.name,
        rows: invalid,
      });
    }
    if (!present.length) {
      issues.push({
        id: `empty-${column.id}`,
        title: `Empty column: ${column.name}`,
        description: 'This column does not contain any values.',
        severity: 'high',
        count: dataset.rowCount,
        column: column.name,
        rows: dataset.rows.map((_, index) => index),
      });
    } else if (new Set(present).size === 1 && dataset.rowCount > 1) {
      issues.push({
        id: `constant-${column.id}`,
        title: `Constant values in ${column.name}`,
        description: 'Every non-empty cell has the same value.',
        severity: 'low',
        count: present.length,
        column: column.name,
        rows: values.flatMap((value, index) => (!isEmpty(value) ? [index] : [])),
      });
    }

    const type = column.dataType;
    const invalidRows = values.flatMap((value, index) => {
      if (isEmpty(value)) return [];
      if (type === 'number' && !Number.isFinite(Number(value.replace(/,/g, '')))) return [index];
      if ((type === 'date' || type === 'datetime') && !Number.isFinite(Date.parse(value))) return [index];
      return [];
    });
    if (invalidRows.length) {
      issues.push({
        id: `invalid-${column.id}`,
        title: `Mixed or invalid values in ${column.name}`,
        description: 'Some records do not match the detected column type.',
        severity: 'medium',
        count: invalidRows.length,
        column: column.name,
        rows: invalidRows,
      });
    }

    const whitespaceRows = values.flatMap((value, index) =>
      value !== value.trim() ? [index] : [],
    );
    if (whitespaceRows.length) {
      issues.push({
        id: `whitespace-${column.id}`,
        title: `Extra whitespace in ${column.name}`,
        description: 'Some values contain leading or trailing spaces.',
        severity: 'low',
        count: whitespaceRows.length,
        column: column.name,
        rows: whitespaceRows,
      });
    }
  }
  return issues.sort((a, b) => b.count - a.count);
}

export function datasetMetrics(dataset: Dataset, issues: QualityIssue[] = analyzeQuality(dataset)): {
  missing: number;
  duplicates: number;
  numeric: number;
  text: number;
  dates: number;
  booleans: number;
} {
  const duplicateCount = issues.find((issue) => issue.id === 'duplicate-rows')?.count ?? 0;
  return {
    missing: dataset.columns.reduce((total, column) => total + column.missingCount, 0),
    duplicates: duplicateCount,
    numeric: dataset.columns.filter((column) => column.dataType === 'number').length,
    text: dataset.columns.filter((column) => column.dataType === 'string').length,
    dates: dataset.columns.filter((column) => column.dataType === 'date' || column.dataType === 'datetime').length,
    booleans: dataset.columns.filter((column) => column.dataType === 'boolean').length,
  };
}

export function summarizeColumn(dataset: Dataset, column: DatasetColumn, rows = dataset.rows): {
  values: { label: string; count: number }[];
  profile?: NumericProfile;
  missing: number;
  unique: number;
} {
  const values = rows.map((row) => row[column.name] ?? '');
  const frequencies = new Map<string, number>();
  values.filter((value) => !isEmpty(value)).forEach((value) => frequencies.set(value, (frequencies.get(value) ?? 0) + 1));
  const mostFrequent = [...frequencies.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return {
    values: mostFrequent,
    profile: column.dataType === 'number' ? getNumericProfile(dataset, column.name, rows) : undefined,
    missing: values.filter(isEmpty).length,
    unique: frequencies.size,
  };
}

export function buildInsights(dataset: Dataset, rows = dataset.rows): string[] {
  const insights: string[] = [];
  for (const column of dataset.columns) {
    if (column.dataType === 'number') {
      const profile = getNumericProfile(dataset, column.name, rows);
      const row = rows.find((item) => Number(item[column.name]) === profile.max);
      if (row && profile.count) {
        insights.push(`${column.name} reaches ${profile.max.toLocaleString()} in ${row[dataset.columns.find((item) => item.dataType === 'string')?.name ?? column.name]}.`);
      }
    } else if (column.dataType === 'string') {
      const top = summarizeColumn(dataset, column, rows).values[0];
      if (top && rows.length) {
        insights.push(`${top.label} is the most common ${column.name} value (${Math.round((top.count / rows.length) * 100)}%).`);
      }
    }
  }
  const metrics = datasetMetrics(dataset);
  if (metrics.missing) insights.push(`${metrics.missing.toLocaleString()} missing values were found across ${dataset.columns.filter((column) => column.missingCount).length} columns.`);
  if (metrics.duplicates) insights.push(`${metrics.duplicates.toLocaleString()} records are part of duplicate rows.`);
  return insights.slice(0, 5);
}

export function aggregate(values: string[], operation: string): number {
  const numbers = values.map((value) => Number(value.replace(/,/g, ''))).filter(Number.isFinite);
  if (operation === 'count') return values.filter((value) => !isEmpty(value)).length;
  if (!numbers.length) return 0;
  switch (operation) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0);
    case 'average':
      return numbers.reduce((total, value) => total + value, 0) / numbers.length;
    case 'minimum':
      return Math.min(...numbers);
    case 'maximum':
      return Math.max(...numbers);
    case 'median': {
      const sorted = [...numbers].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    }
    default:
      return 0;
  }
}
