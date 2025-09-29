import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  TextField,
  Chip,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Autocomplete,
  Checkbox,
  IconButton,
  Tooltip,
  Grid,
  useTheme
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ReferenceLine
} from 'recharts';
import { Dayjs } from 'dayjs';
import { PaginationResult, ConsultantMonthlyTotal, User } from 'shared/src/types';
import YearMonthPicker from './ui/YearMonthPicker';
import {
  YearMonth,
  dayjsToYearMonth,
  formatMonth,
  formatYearMonth,
  getCurrentMonth,
} from '../lib/yearMonth';

type MonthlyTotalsResponse = PaginationResult<ConsultantMonthlyTotal>;
type ConsultantsResponse = PaginationResult<User>;

const fetchMonthlyTotals = async (params: {
  start: string;
  end: string;
  userId?: string[];
}): Promise<ConsultantMonthlyTotal[]> => {
  let allData: ConsultantMonthlyTotal[] = [];
  let offset = 0;
  const limit = 100;
  let hasNext = true;

  while (hasNext) {
    const searchParams = new URLSearchParams({
      start: params.start,
      end: params.end,
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (params.userId && params.userId.length > 0) {
      params.userId.forEach(id => searchParams.append('userId', id));
    }

    const response = await fetch(`api/v1/consultant/monthly-totals?${searchParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch monthly totals');
    }

    const data: MonthlyTotalsResponse = await response.json();
    allData.push(...data.content);
    hasNext = data.hasNext;
    offset += limit;
  }

  return allData;
};

const fetchConsultants = async (): Promise<User[]> => {
  let allConsultants: User[] = [];
  let offset = 0;
  const limit = 100;
  let hasNext = true;

  while (hasNext) {
    const response = await fetch(`api/v1/consultant?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error('Failed to fetch consultants');
    }

    const data: ConsultantsResponse = await response.json();
    allConsultants.push(...data.content);
    hasNext = data.hasNext;
    offset += limit;
  }

  return allConsultants;
};

const ConsultantTab: React.FC = () => {
  const theme = useTheme();
  const currentMonth = getCurrentMonth();
  const [startDate, setStartDate] = useState<Dayjs | null>(currentMonth);
  const [endDate, setEndDate] = useState<Dayjs | null>(currentMonth);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [expandedConsultants, setExpandedConsultants] = useState<Set<string>>(new Set());

  const { data: consultants = [], isLoading: consultantsLoading } = useQuery({
    queryKey: ['consultants'],
    queryFn: fetchConsultants,
  });

  const consultantMap = React.useMemo(() => {
    const map = new Map<string, User>();
    consultants.forEach(consultant => {
      map.set(consultant.id, consultant);
    });
    return map;
  }, [consultants]);

  const selectedConsultants = React.useMemo(() => {
    return selectedUsers.map(userId => consultantMap.get(userId)).filter(Boolean) as User[];
  }, [selectedUsers, consultantMap]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['monthlyTotals', dayjsToYearMonth(startDate), dayjsToYearMonth(endDate), selectedUsers],
    queryFn: () => fetchMonthlyTotals({
      start: dayjsToYearMonth(startDate),
      end: dayjsToYearMonth(endDate),
      userId: selectedUsers.length > 0 ? selectedUsers : undefined,
    }),
    enabled: !!startDate && !!endDate,
  });

  const handleRefresh = () => {
    refetch();
  };

  const toggleConsultantExpansion = (userId: string) => {
    setExpandedConsultants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getConsultantName = (userId: string) => {
    return consultantMap.get(userId)?.name || `Usuário ${userId}`;
  };

  const groupedData = React.useMemo(() => {
    if (!data) return {};

    const grouped: Record<string, ConsultantMonthlyTotal[]> = {};
    data.forEach(item => {
      if (!grouped[item.userId]) {
        grouped[item.userId] = [];
      }
      grouped[item.userId].push(item);
    });

    return grouped;
  }, [data]);

  const consultantTotals = React.useMemo(() => {
    const totals: Record<string, {
      netValue: number;
      comissionValue: number;
      fixedCost: number;
      profit: number;
      months: number;
      firstYearMonth: YearMonth;
      lastYearMonth: YearMonth;
    }> = {};

    Object.entries(groupedData).forEach(([userId, items]) => {
      const firstItem = items[0];
      const lastItem = items[items.length - 1]

      totals[userId] = {
        netValue: items.reduce((sum, item) => sum + item.netValue, 0),
        comissionValue: items.reduce((sum, item) => sum + item.comissionValue, 0),
        fixedCost: items.reduce((sum, item) => sum + item.fixedCost, 0),
        profit: items.reduce((sum, item) => sum + item.profit, 0),
        months: items.length,
        firstYearMonth: { year: firstItem.year, month: firstItem.month },
        lastYearMonth: { year: lastItem.year, month: lastItem.month },
      };
    });

    return totals;
  }, [groupedData]);

  // Calculate average fixed cost per consultant (since it's a fixed value per consultant)
  const averageFixedCost = React.useMemo(() => {
    if (!data || data.length === 0) return 0;
    
    // Get unique consultants and their fixed costs
    const consultantFixedCosts = new Map<string, number>();
    
    data.forEach(item => {
      // Since fixed cost is the same for each consultant across months,
      // we only need to store it once per consultant
      if (!consultantFixedCosts.has(item.userId)) {
        consultantFixedCosts.set(item.userId, item.fixedCost);
      }
    });
    
    const totalFixedCost = Array.from(consultantFixedCosts.values()).reduce((sum, cost) => sum + cost, 0);
    return totalFixedCost / consultantFixedCosts.size;
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'success';
    if (profit < 0) return 'error';
    return 'default';
  };

  const generateColors = (count: number) => {
    const colors = [
      '#e74c3c', // Red
      '#3498db', // Blue
      '#2ecc71', // Green
      '#f39c12', // Orange
      '#9b59b6', // Purple
      '#1abc9c', // Teal
      '#e67e22', // Dark Orange
      '#34495e', // Dark Blue-Gray
      '#f1c40f', // Yellow
      '#e91e63', // Pink
      '#00bcd4', // Cyan
      '#4caf50', // Light Green
      '#ff5722', // Deep Orange
      '#673ab7', // Deep Purple
      '#795548', // Brown
      '#607d8b', // Blue Gray
      '#ff9800', // Amber
      '#8bc34a', // Light Green
      '#ff6b6b', // Light Red
      '#4ecdc4', // Turquoise
      '#45b7d1', // Sky Blue
      '#96ceb4', // Mint Green
      '#feca57', // Bright Yellow
      '#ff9ff3', // Light Pink
      '#54a0ff', // Bright Blue
      '#5f27cd', // Violet
      '#00d2d3', // Aqua
      '#ff9f43', // Peach
      '#10ac84', // Emerald
      '#ee5a24'  // Vermillion
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  const barChartData = React.useMemo(() => {
    if (!data) return [];

    const monthlyData: Record<string, any> = {};

    data.forEach(item => {
      const monthKey = `${item.month.toString().padStart(2, '0')}/${item.year}`;
      const consultantName = getConsultantName(item.userId);

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey };
      }

      monthlyData[monthKey][consultantName] = item.netValue;
    });

    return Object.values(monthlyData).sort((a: any, b: any) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
    });
  }, [data, consultantMap]);

  const pieChartData = React.useMemo(() => {
    if (!data) return [];

    const consultantTotals: Record<string, number> = {};

    data.forEach(item => {
      const consultantName = getConsultantName(item.userId);
      consultantTotals[consultantName] = (consultantTotals[consultantName] || 0) + item.netValue;
    });

    return Object.entries(consultantTotals).map(([name, value]) => ({
      name,
      value,
      percentage: 0 // Will be calculated by Recharts
    })).sort((a, b) => b.value - a.value);
  }, [data, consultantMap]);

  const uniqueConsultants = React.useMemo(() => {
    if (!data) return [];
    const consultants = Array.from(new Set(data.map(item => getConsultantName(item.userId))));
    return consultants.sort();
  }, [data, consultantMap]);

  const consultantColors = generateColors(uniqueConsultants.length);
  const pieColors = generateColors(pieChartData.length);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar dados: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 600, color: 'text.primary' }}>
        Totais Mensais dos Consultores
      </Typography>

      {/* Date and Consultant Filters */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mb: 2,
        flexWrap: 'wrap',
        alignItems: 'flex-end'
      }}>
        <YearMonthPicker
          label="Mês Início"
          value={startDate}
          onChange={setStartDate}
          size="small"
        />

        <YearMonthPicker
          label="Mês Fim"
          value={endDate}
          onChange={setEndDate}
          size="small"
        />

        <Autocomplete
          multiple
          options={consultants}
          getOptionLabel={(option) => option.name}
          value={selectedConsultants}
          onChange={(_event, newValue) => {
            setSelectedUsers(newValue.map(consultant => consultant.id));
          }}
          loading={consultantsLoading}
          renderOption={(props, option, { selected }) => (
            <li {...props} key={option.id}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              {option.name}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Consultores"
              placeholder="Selecionar consultores..."
              size="small"
              sx={{
                minWidth: 150,
                '& .MuiInputBase-root': {
                  borderRadius: 1,
                },
              }}
            />
          )}
          sx={{ minWidth: 400 }}
        />

        <Tooltip title="Atualizar dados">
          <span>
            <IconButton
              onClick={handleRefresh}
              disabled={isLoading}
              color="primary"
              sx={{
                color: 'white',
                '&:hover': { bgcolor: 'primary.dark' },
                '&:disabled': { bgcolor: 'action.disabled' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Loading State */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Carregando...
            </Typography>
          </Box>
        </Box>
      )}

      {/* Charts Section */}
      {!isLoading && Object.keys(groupedData).length > 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
          {/* Bar Chart */}
          <Grid size={{ xs: 4, sm: 8, md: 8 }}>
            <Card sx={{ elevation: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                  Valores Líquidos por Mês/Ano
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Linha vermelha: Custo fixo médio ({formatCurrency(averageFixedCost)})
                  </Typography>
                </Box>
                <Box sx={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer>
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme.palette.divider}
                        opacity={0.5}
                      />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        stroke={theme.palette.text.secondary}
                        tickLine={{ stroke: theme.palette.divider }}
                        axisLine={{ stroke: theme.palette.divider }}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
                        stroke={theme.palette.text.secondary}
                        tickLine={{ stroke: theme.palette.divider }}
                        axisLine={{ stroke: theme.palette.divider }}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                        labelStyle={{ color: theme.palette.text.primary }}
                        contentStyle={{
                          background: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 12,
                          boxShadow: theme.shadows[8],
                          opacity: 1,
                          backdropFilter: 'blur(20px)'
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          color: theme.palette.text.primary,
                          fontSize: '14px'
                        }}
                      />
                      <ReferenceLine
                        y={averageFixedCost}
                        stroke="#d32f2f"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                      {uniqueConsultants.map((consultant, index) => (
                        <Bar
                          key={consultant}
                          dataKey={consultant}
                          fill={consultantColors[index]}
                          radius={[8, 8, 0, 0]}
                          style={{
                            filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'none'
                          }}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Pie Chart */}
          <Grid size={{ xs: 4, sm: 8, md: 4 }}>
            <Card sx={{ elevation: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Distribuição Total por Consultor
                </Typography>
                <Box sx={{ width: '100%', height: 400, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ flex: 1, minHeight: 280 }}>
                    <ResponsiveContainer>
                      <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          innerRadius={30}
                          paddingAngle={3}
                          dataKey="value"
                          fontSize={10}
                          stroke={theme.palette.background.paper}
                          strokeWidth={2}
                        >
                          {pieChartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={pieColors[index]}
                              style={{
                                filter: theme.palette.mode === 'dark' ? 'brightness(1.1)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                              }}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => [formatCurrency(value), 'Valor Total']}
                          itemStyle={{ color: theme.palette.text.primary }}
                          contentStyle={{
                            backgroundColor: theme.palette.background.paper,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 12,
                            boxShadow: theme.shadows[8],
                            opacity: 1,
                            backdropFilter: 'blur(20px)',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>

                  {/* Custom Legend */}
                  <Box sx={{
                    mt: 2,
                    maxHeight: 100,
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      width: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: '#ccc',
                      borderRadius: '2px',
                    }
                  }}>
                    {pieChartData.map((entry, index) => {
                      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
                      const percentage = ((entry.value / total) * 100).toFixed(1);

                      return (
                        <Box
                          key={entry.name}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mb: 0.5,
                            fontSize: '0.75rem',
                          }}
                        >
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              backgroundColor: pieColors[index],
                              borderRadius: '2px',
                              mr: 1,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1,
                            mr: 1,
                          }}>
                            {entry.name}
                          </Box>
                          <Box sx={{
                            fontWeight: 600,
                            color: 'text.secondary',
                            flexShrink: 0,
                          }}>
                            {percentage}%
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* No Data State */}
      {!isLoading && Object.keys(groupedData).length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum dado encontrado
          </Typography>
        </Box>
      )}

      {/* Individual Consultant Tables */}
      {!isLoading && Object.entries(groupedData).map(([userId, monthlyData]) => {
        const consultantName = getConsultantName(userId);
        const totals = consultantTotals[userId];
        const isExpanded = expandedConsultants.has(userId);

        return (
          <Card key={userId} sx={{ mb: 4, elevation: 2 }}>
            <CardContent>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    {consultantName}
                  </Typography>
                  <Chip
                    label={`${totals.months} ${totals.months === 1 ? 'mês' : 'meses'}`}
                    size="small"
                    variant="outlined"
                    color="default"
                  />
                </Box>

                <Tooltip title={isExpanded ? "Ocultar detalhes" : "Mostrar detalhes"}>
                  <IconButton
                    onClick={() => toggleConsultantExpansion(userId)}
                    size="small"
                    sx={{
                      transition: 'transform 0.2s',
                      transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
                    }}
                  >
                    <ExpandMoreIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              {isExpanded && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Ano</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Mês</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor Líquido</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Comissão</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Custo Fixo</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Lucro</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyData.map((row) => (
                        <TableRow
                          key={`${row.userId}-${row.year}-${row.month}`}
                          hover
                        >
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{formatMonth(row.month)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.netValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.comissionValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.fixedCost)}</TableCell>
                          <TableCell align="right">
                            <Chip
                              label={formatCurrency(row.profit)}
                              color={getProfitColor(row.profit)}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Totals Footer */}
                    <TableBody>
                      <TableRow sx={{ bgcolor: 'primary.50', '& td': { fontWeight: 600, borderTop: 2, borderColor: 'primary.200' } }}>
                        <TableCell colSpan={2}>
                          TOTAL ({totals.months} {totals.months === 1 ? 'mês' : 'meses'})
                        </TableCell>
                        <TableCell align="right">{formatCurrency(totals.netValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.comissionValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.fixedCost)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={formatCurrency(totals.profit)}
                            color={getProfitColor(totals.profit)}
                            variant="filled"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Summary when collapsed */}
              {!isExpanded && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.300'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Resumo do período: {formatYearMonth(totals.firstYearMonth)} à {formatYearMonth(totals.lastYearMonth)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Valor Líquido
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.netValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Comissão
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.comissionValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Custo Fixo
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.fixedCost)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Lucro
                      </Typography>
                      <Typography>
                        <Chip
                          label={formatCurrency(totals.profit)}
                          color={getProfitColor(totals.profit)}
                          variant="filled"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
};

export default ConsultantTab;
