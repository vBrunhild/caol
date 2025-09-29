import { useState } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Box } from '@mui/material';
import { Dayjs } from "dayjs";

interface YearMonthPickerProps {
  value?: Dayjs | null;
  onChange?: (date: Dayjs | null) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  minDate?: Dayjs;
  maxDate?: Dayjs;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

export default function YearMonthPicker({
  value = null,
  onChange,
  label = 'Selecionar Mês/Ano',
  disabled = false,
  error = false,
  helperText,
  minDate,
  maxDate,
  fullWidth = false,
  size = 'medium',
}: YearMonthPickerProps) {
  const [internalValue, setInternalValue] = useState<Dayjs | null>(value);

  const handleChange = (newValue: Dayjs | null) => {
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
      <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <DatePicker
          value={internalValue}
          onChange={handleChange}
          views={['year', 'month']}
          openTo="month"
          label={label}
          disabled={disabled}
          minDate={minDate}
          maxDate={maxDate}
          format="MM/YYYY"
          slotProps={{
            textField: {
              error,
              helperText,
              fullWidth,
              variant: 'outlined',
              size,
              sx: {
                '& .MuiInputBase-root': {
                  borderRadius: 2,
                },
              },
            },
            toolbar: {
              hidden: true,
            },
          }}
          sx={{
            width: fullWidth ? '100%' : 'auto',
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
