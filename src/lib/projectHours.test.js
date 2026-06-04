import { describe, it, expect } from 'vitest';
import { computeProjectHours, slicesForChart } from './projectHours';

const PROJECTS = [
  { id: 'p1', name: 'Alpha' },
  { id: 'p2', name: 'Beta' },
  { id: 'p3', name: 'Gamma' },
];

describe('computeProjectHours', () => {
  it('returns empty array when no time entries', () => {
    expect(computeProjectHours([], PROJECTS)).toEqual([]);
  });

  it('excludes projects with no entries', () => {
    const entries = [{ projectId: 'p1', hours: 5 }];
    const result = computeProjectHours(entries, PROJECTS);
    expect(result.map(p => p.id)).toEqual(['p1']);
  });

  it('ignores entries for unknown projects', () => {
    const entries = [{ projectId: 'unknown', hours: 99 }];
    expect(computeProjectHours(entries, PROJECTS)).toEqual([]);
  });

  it('sums multiple entries for the same project', () => {
    const entries = [
      { projectId: 'p1', hours: 3 },
      { projectId: 'p1', hours: 4.5 },
    ];
    const result = computeProjectHours(entries, PROJECTS);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 'p1', name: 'Alpha', hours: 7.5 });
  });

  it('sums hours across multiple projects', () => {
    const entries = [
      { projectId: 'p2', hours: 2 },
      { projectId: 'p1', hours: 10 },
      { projectId: 'p2', hours: 3 },
    ];
    const result = computeProjectHours(entries, PROJECTS);
    expect(result.find(p => p.id === 'p1').hours).toBe(10);
    expect(result.find(p => p.id === 'p2').hours).toBe(5);
  });

  it('sorts descending by hours', () => {
    const entries = [
      { projectId: 'p3', hours: 1 },
      { projectId: 'p1', hours: 10 },
      { projectId: 'p2', hours: 5 },
    ];
    const result = computeProjectHours(entries, PROJECTS);
    expect(result.map(p => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('rounds hours to 2 decimal places', () => {
    const entries = [
      { projectId: 'p1', hours: 1.005 },
      { projectId: 'p1', hours: 1.005 },
    ];
    const result = computeProjectHours(entries, PROJECTS);
    expect(result[0].hours).toBe(2.01);
  });
});

describe('slicesForChart', () => {
  it('returns empty array for empty input', () => {
    expect(slicesForChart([])).toEqual([]);
  });

  it('computes pct for each slice', () => {
    const input = [
      { id: 'p1', name: 'A', hours: 3 },
      { id: 'p2', name: 'B', hours: 1 },
    ];
    const result = slicesForChart(input);
    expect(result[0].pct).toBeCloseTo(0.75);
    expect(result[1].pct).toBeCloseTo(0.25);
  });

  it('pct values sum to 1', () => {
    const input = [
      { id: 'p1', name: 'A', hours: 7 },
      { id: 'p2', name: 'B', hours: 2 },
      { id: 'p3', name: 'C', hours: 1 },
    ];
    const total = slicesForChart(input).reduce((s, p) => s + p.pct, 0);
    expect(total).toBeCloseTo(1);
  });

  it('does not add Other when within maxSlices', () => {
    const input = Array.from({ length: 4 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, hours: 1 }));
    const result = slicesForChart(input, 8);
    expect(result.find(s => s.name === 'Other')).toBeUndefined();
    expect(result).toHaveLength(4);
  });

  it('groups excess into Other when over maxSlices', () => {
    const input = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, hours: 1 }));
    const result = slicesForChart(input, 8);
    expect(result).toHaveLength(9);
    const other = result.find(s => s.name === 'Other');
    expect(other).toBeDefined();
    expect(other.hours).toBe(2);
    expect(other.pct).toBeCloseTo(0.2);
  });

  it('single project gets pct of 1', () => {
    const input = [{ id: 'p1', name: 'Solo', hours: 42 }];
    const result = slicesForChart(input);
    expect(result).toHaveLength(1);
    expect(result[0].pct).toBe(1);
  });
});
