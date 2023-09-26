import { Injectable } from '@nestjs/common';
import { TimePeriod, TimePeriodEnum } from '../types/common.type';
import moment from 'moment';
import {
  BarChartMetricValue,
  CycleRanges,
  DateTimeRange,
  StackedBarValue,
  StackedChartMetricValue,
} from '../interfaces/common.interface';

@Injectable()
export class CommonService {
  dateTimeRangeFromTimePeriod(timePeriod: TimePeriod): DateTimeRange {
    const currentMoment = moment().utc();
    let startMoment: moment.Moment;

    switch (timePeriod) {
      case TimePeriodEnum.TODAY:
        startMoment = moment(currentMoment).startOf('day');
        break;

      case TimePeriodEnum.YESTERDAY:
        startMoment = moment(currentMoment).add(-1, 'day').startOf('day');
        break;

      case TimePeriodEnum.LAST_WEEK:
        startMoment = moment(currentMoment).startOf('week');
        break;

      case TimePeriodEnum.LAST_MONTH:
        startMoment = moment(currentMoment).startOf('month');
        break;

      case TimePeriodEnum.LAST_YEAR:
        startMoment = moment(currentMoment).startOf('year');
        break;

      default:
        throw new Error('Time period has an invalid value');
    }

    return {
      start: startMoment.toISOString(),
      end: currentMoment.toISOString(),
    };
  }

  enumerateDaysBetweenRange(start: string, end: string) {
    const daysDate: Array<string> = [];
    let iterateDate = moment(start);

    while (iterateDate.isSameOrBefore(end)) {
      daysDate.push(iterateDate.toISOString());

      iterateDate = iterateDate.add(1, 'day');
    }

    return daysDate;
  }

  lastTwoMonthsCycleRanges(): CycleRanges {
    const currentMoment = moment().utc();
    const currentCycleStart = moment(currentMoment)
      .add(-1, 'month')
      .startOf('month');

    return {
      current: {
        start: currentCycleStart.toISOString(),
        end: currentMoment.toISOString(),
      },
      previous: {
        start: moment(currentCycleStart).add(-2, 'months').toISOString(),
        end: moment(currentCycleStart).add(-1, 'day').toISOString(),
      },
    };
  }

  serializeToBarChartMetricValues<T>(input_list: Array<T>) {
    const barChartMetricValues: Array<BarChartMetricValue> = [];

    for (let index = 0; index < input_list.length; index++) {
      barChartMetricValues.push({
        date: input_list[index]['date'].toISOString(),
        value: input_list[index]['metric_value'],
      });
    }

    return barChartMetricValues;
  }

  serializeToBarChartMetricsValues<T>(input_list: Array<T>) {
    const barChartMetricsValues: Record<
      string,
      Array<BarChartMetricValue>
    > = {};

    for (let index = 0; index < input_list.length; index++) {
      const metricDate = input_list[index]['date'].toISOString();
      const metricName = input_list[index]['metric_name'];
      const metricValue = input_list[index]['metric_value'];

      if (metricName in barChartMetricsValues) {
        barChartMetricsValues[metricName].push({
          date: metricDate,
          value: metricValue,
        });
      } else {
        barChartMetricsValues[metricName] = [
          {
            date: metricDate,
            value: metricValue,
          },
        ];
      }
    }

    return barChartMetricsValues;
  }

  serializeToStackedChartMetricValues<T>(input_list: Array<T>) {
    const groupByDate: Record<string, Array<StackedBarValue>> = {};
    const stackedChartMetricValues: Array<StackedChartMetricValue> = [];

    for (let index = 0; index < input_list.length; index++) {
      const metricDate = input_list[index]['date'].toISOString();
      const metricName = input_list[index]['metric_name'];
      const metricValue = input_list[index]['metric_value'];

      if (metricDate in groupByDate) {
        groupByDate[metricDate].push({ name: metricName, value: metricValue });
      } else {
        groupByDate[metricDate] = [{ name: metricName, value: metricValue }];
      }
    }
    for (const date in groupByDate) {
      if (Object.prototype.hasOwnProperty.call(groupByDate, date)) {
        stackedChartMetricValues.push({
          date: date,
          values: groupByDate[date],
        });
      }
    }

    return stackedChartMetricValues;
  }
}
