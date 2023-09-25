export enum TimePeriodEnum {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  LAST_WEEK = 'last-week',
  LAST_MONTH = 'last-month',
  LAST_YEAR = 'last-year',
}

export type TimePeriod = `${TimePeriodEnum}`;
