export interface DateTimeRange {
  start: string;
  end: string;
}

export interface CycleRanges {
  current: DateTimeRange;
  previous: DateTimeRange;
}

export interface MetricsResponse<T> {
  metrics: T;
}

export interface StringTypeMetricResponse {
  value: string;
}

export interface NumberTypeMetricResponse {
  value: number;
  previous?: number;
  change?: number;
}

export interface BarChartMetricValue {
  date: string;
  value: number;
}

export interface BarChartMetricResponse {
  values: Array<BarChartMetricValue>;
}

export interface StackedBarValue {
  name: string;
  value: number;
}

export interface StackedChartMetricValue {
  date: string;
  values: Array<StackedBarValue>;
}

export interface StackedChartMetricResponse {
  values: Array<StackedChartMetricValue>;
}
