import { ActivityFilters, ActivityItem } from '../types';

export function mergeAndDedupeActivity(pending: ActivityItem[], history: ActivityItem[]): ActivityItem[] {
  const byHash = new Map<string, ActivityItem>();

  [...history, ...pending].forEach((item) => {
    const existing = byHash.get(item.txHash);
    if (!existing) {
      byHash.set(item.txHash, item);
      return;
    }

    if (Date.parse(item.createdAt) > Date.parse(existing.createdAt)) {
      byHash.set(item.txHash, item);
    }
  });

  return [...byHash.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function filterActivity(items: ActivityItem[], filters: ActivityFilters): ActivityItem[] {
  return items.filter((item) => {
    if (filters.statuses.length && !filters.statuses.includes(item.status)) {
      return false;
    }

    if (filters.actions.length && !filters.actions.includes(item.action)) {
      return false;
    }

    return true;
  });
}
