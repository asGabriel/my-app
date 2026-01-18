import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

export interface FilterBarValues {
  startDate: string;
  endDate: string;
  month: Dayjs;
}

interface FilterBarProps {
  value?: FilterBarValues;
  onChange?: (filters: FilterBarValues) => void;
}

function getMonthRange(date: Dayjs): Omit<FilterBarValues, 'month'> {
  return {
    startDate: date.startOf('month').format('YYYY-MM-DD'),
    endDate: date.endOf('month').format('YYYY-MM-DD'),
  };
}

function createFilterValues(date: Dayjs): FilterBarValues {
  return {
    ...getMonthRange(date),
    month: date,
  };
}

export function getDefaultFilters(): FilterBarValues {
  return createFilterValues(dayjs());
}

export function FilterBar({ value, onChange }: FilterBarProps) {
  const handleMonthChange = (date: Dayjs | null) => {
    if (date && onChange) {
      onChange(createFilterValues(date));
    }
  };

  return (
    <DatePicker
      picker="month"
      value={value?.month}
      defaultValue={dayjs()}
      onChange={handleMonthChange}
      format="MMM/YYYY"
      allowClear={false}
      style={{ width: '100%', maxWidth: 150 }}
    />
  );
}
