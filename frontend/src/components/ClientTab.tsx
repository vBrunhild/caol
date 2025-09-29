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
  Tooltip as RechartsTooltip
} from 'recharts';
import { Dayjs } from 'dayjs';
import { PaginationResult, Client, ClientMonthlyTotal } from 'shared/src/types';
import YearMonthPicker from './ui/YearMonthPicker';
import {
    YearMonth,
    dayjsToYearMonth,
    formatMonth,
    formatYearMonth,
    getCurrentMonth,
} from '../lib/yearMonth';

type MonthlyTotalsResponse = PaginationResult<ClientMonthlyTotal>;
type ClientsResponse = PaginationResult<Client>;

const fetchClientMonthlyTotals = async (params: {
  start: string;
  end: string;
  clientId?: string[];
}): Promise<ClientMonthlyTotal[]> => {
  let allData: ClientMonthlyTotal[] = [];
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

    if (params.clientId && params.clientId.length > 0) {
      params.clientId.forEach(id => searchParams.append('clientId', id));
    }

    const response = await fetch(`api/v1/client/monthly-totals?${searchParams}`);

    if (!response.ok) {
      throw new Error('Failed to fetch client monthly totals');
    }

    const data: MonthlyTotalsResponse = await response.json();
    allData.push(...data.content);
    hasNext = data.hasNext;
    offset += limit;
  }

  return allData;
};

const fetchClients = async (): Promise<Client[]> => {
  let allClients: Client[] = [];
  let offset = 0;
  const limit = 100;
  let hasNext = true;

  while (hasNext) {
    const response = await fetch(`api/v1/client?limit=${limit}&offset=${offset}`);

    if (!response.ok) {
      throw new Error('Failed to fetch clients');
    }

    const data: ClientsResponse = await response.json();
    allClients.push(...data.content);
    hasNext = data.hasNext;
    offset += limit;
  }

  return allClients;
};

const ClientTab: React.FC = () => {
  const theme = useTheme();
  const currentMonth = getCurrentMonth();
  const [startDate, setStartDate] = useState<Dayjs | null>(currentMonth);
  const [endDate, setEndDate] = useState<Dayjs | null>(currentMonth);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const clientMap = React.useMemo(() => {
    const map = new Map<string, Client>();
    clients.forEach(client => {
      map.set(client.clientId.toString(), client);
    });
    return map;
  }, [clients]);

  const selectedClientObjects = React.useMemo(() => {
    return selectedClients.map(clientId => clientMap.get(clientId)).filter(Boolean) as Client[];
  }, [selectedClients, clientMap]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['clientMonthlyTotals', dayjsToYearMonth(startDate), dayjsToYearMonth(endDate), selectedClients],
    queryFn: () => fetchClientMonthlyTotals({
      start: dayjsToYearMonth(startDate),
      end: dayjsToYearMonth(endDate),
      clientId: selectedClients.length > 0 ? selectedClients : undefined,
    }),
    enabled: !!startDate && !!endDate,
  });

  const handleRefresh = () => {
    refetch();
  };

  const toggleClientExpansion = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const getClientName = (clientId: string) => {
    const client = clientMap.get(clientId);
    return client?.companyName || client?.tradeName || `Cliente ${clientId}`;
  };

  const groupedData = React.useMemo(() => {
    if (!data) return {};

    const grouped: Record<string, ClientMonthlyTotal[]> = {};
    data.forEach(item => {
      if (!grouped[item.clientId]) {
        grouped[item.clientId] = [];
      }
      grouped[item.clientId].push(item);
    });

    return grouped;
  }, [data]);

  const clientTotals = React.useMemo(() => {
    const totals: Record<string, {
      invoiceValue: number;
      taxesValue: number;
      netValue: number;
      months: number;
      firstYearMonth: YearMonth;
      lastYearMonth: YearMonth;
    }> = {};

    Object.entries(groupedData).forEach(([clientId, items]) => {
      const firstItem = items[0];
      const lastItem = items[items.length - 1]

      totals[clientId] = {
        invoiceValue: items.reduce((sum, item) => sum + item.invoiceValue, 0),
        taxesValue: items.reduce((sum, item) => sum + item.taxesValue, 0),
        netValue: items.reduce((sum, item) => sum + item.netValue, 0),
        months: items.length,
        firstYearMonth: { year: firstItem.year, month: firstItem.month },
        lastYearMonth: { year: lastItem.year, month: lastItem.month },
      };
    });

    return totals;
  }, [groupedData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      const clientName = getClientName(item.clientId.toString());

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey };
      }

      monthlyData[monthKey][clientName] = (monthlyData[monthKey][clientName] || 0) + item.netValue;
    });

    return Object.values(monthlyData).sort((a: any, b: any) => {
      const [monthA, yearA] = a.month.split('/');
      const [monthB, yearB] = b.month.split('/');
      return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
    });
  }, [data, clientMap]);

  const pieChartData = React.useMemo(() => {
    if (!data) return [];

    const clientTotalsForPie: Record<string, number> = {};

    data.forEach(item => {
      const clientName = getClientName(item.clientId.toString());
      clientTotalsForPie[clientName] = (clientTotalsForPie[clientName] || 0) + item.netValue;
    });

    return Object.entries(clientTotalsForPie).map(([name, value]) => ({
      name,
      value,
      percentage: 0 // Will be calculated by Recharts
    })).sort((a, b) => b.value - a.value);
  }, [data, clientMap]);

  const uniqueClients = React.useMemo(() => {
    if (!data) return [];
    const clientNames = Array.from(new Set(data.map(item => getClientName(item.clientId.toString()))));
    return clientNames.sort();
  }, [data, clientMap]);

  const clientColors = generateColors(uniqueClients.length);
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
        Totais Mensais dos Clientes
      </Typography>

      {/* Date and Client Filters */}
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
          options={clients}
          getOptionLabel={(option) => option.companyName || option.tradeName || `Cliente ${option.clientId}`}
          value={selectedClientObjects}
          onChange={(_event, newValue) => {
            setSelectedClients(newValue.map(client => client.clientId.toString()));
          }}
          loading={clientsLoading}
          renderOption={(props, option, { selected }) => (
            <li {...props} key={option.clientId}>
              <Checkbox checked={selected} sx={{ mr: 1 }} />
              {option.companyName || option.tradeName || `Cliente ${option.clientId}`}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Clientes"
              placeholder="Selecionar clientes..."
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

      {/* Client Comparison Table */}
      {!isLoading && Object.keys(groupedData).length > 0 && (
        <Card sx={{ mb: 4, elevation: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Comparativo Mensal por Cliente
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 600 }}>
              <Table size="small" stickyHeader>
                <TableHead style={{ opacity: 1 }}>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 600, position: 'sticky', left: 0, zIndex: 1 }}>
                      Mês/Ano
                    </TableCell>
                    {Object.keys(groupedData).map(clientId => (
                      <TableCell
                        key={clientId}
                        align="right"
                        sx={{ fontWeight: 600, minWidth: 120 }}
                      >
                        {getClientName(clientId)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(() => {
                    const allMonths = new Set<string>();
                    Object.values(groupedData).forEach(clientData => {
                      clientData.forEach(item => {
                        allMonths.add(`${item.year}-${item.month.toString().padStart(2, '0')}}`);
                      });
                    });

                    const sortedMonths = Array.from(allMonths).sort();

                    return sortedMonths.map(monthKey => {
                      const [year, month] = monthKey.split('-');
                      const monthNumber = parseInt(month);

                      const monthData: { [clientId: string]: number } = {};
                      Object.entries(groupedData).forEach(([clientId, clientData]) => {
                        const monthItem = clientData.find(item =>
                          item.year === parseInt(year) && item.month === monthNumber
                        );
                        monthData[clientId] = monthItem?.netValue || 0;
                      });

                      const maxValue = Math.max(...Object.values(monthData));
                      const maxClientId = Object.entries(monthData).find(([_, value]) => value === maxValue)?.[0];

                      return (
                        <TableRow key={monthKey} hover>
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              position: 'sticky',
                              left: 0,
                              zIndex: 1,
                            }}
                          >
                            {formatMonth(monthNumber)} {year}
                          </TableCell>
                          {Object.keys(groupedData) .map(clientId => {
                            const value = monthData[clientId];
                            const isHighest = clientId === maxClientId && value > 0;

                            return (
                              <TableCell
                                key={clientId}
                                align="right"
                                sx={{
                                  fontWeight: isHighest ? 600 : 400,
                                  color: isHighest ? 'primary.main' : 'text.primary',
                                }}
                              >
                                {value > 0 ? formatCurrency(value) : '-'}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              * Valores em azul representam o maior valor do mês
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Charts Section */}
      {!isLoading && Object.keys(groupedData).length > 0 && (
        <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
          {/* Bar Chart */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ elevation: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Valores Líquidos por Mês/Ano
                </Typography>
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
                      {uniqueClients.map((client, index) => (
                        <Bar
                          key={client}
                          dataKey={client}
                          fill={clientColors[index]}
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
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ elevation: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Distribuição Total por Cliente
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

      {/* Individual Client Tables */}
      {!isLoading && Object.entries(groupedData)
          .sort(([clientIdA], [clientIdB]) => {
            const nameA = getClientName(clientIdA);
            const nameB = getClientName(clientIdB);
            return nameA.localeCompare(nameB);
          })
          .map(([clientId, monthlyData]) => {
        const clientName = getClientName(clientId);
        const totals = clientTotals[clientId];
        const isExpanded = expandedClients.has(clientId);

        return (
          <Card key={clientId} sx={{ mb: 4, elevation: 2 }}>
            <CardContent>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    {clientName}
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
                    onClick={() => toggleClientExpansion(clientId)}
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
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor da Fatura</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Impostos</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Valor Líquido</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {monthlyData.map((row) => (
                        <TableRow
                          key={`${row.clientId}-${row.year}-${row.month}`}
                          hover
                        >
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{formatMonth(row.month)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.invoiceValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.taxesValue)}</TableCell>
                          <TableCell align="right">{formatCurrency(row.netValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>

                    {/* Totals Footer */}
                    <TableBody>
                      <TableRow>
                        <TableCell colSpan={2}>
                          TOTAL ({totals.months} {totals.months === 1 ? 'mês' : 'meses'})
                        </TableCell>
                        <TableCell align="right">{formatCurrency(totals.invoiceValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.taxesValue)}</TableCell>
                        <TableCell align="right">{formatCurrency(totals.netValue)}</TableCell>
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
                    Resumo do período: {formatYearMonth(totals.firstYearMonth)} á {formatYearMonth(totals.lastYearMonth)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Valor da Fatura
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.invoiceValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Impostos
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.taxesValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Valor Líquido
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(totals.netValue)}
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

export default ClientTab;
