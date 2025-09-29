import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Divider,
  useTheme,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Description as InvoiceIcon,
  Assignment as ServiceOrderIcon,
  Business as ClientIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { Dayjs } from 'dayjs';
import {
  PaginationResult,
  Client,
  User,
  Invoice,
  ServiceOrder,
  ClientMonthlyTotal,
  ConsultantMonthlyTotal
} from 'shared/src/types';
import YearMonthPicker from './ui/YearMonthPicker';
import {
  dayjsToYearMonth,
  getCurrentMonth,
  formatYearMonth
} from '../lib/yearMonth';

interface DashboardMetrics {
  totalRevenue: number;
  totalInvoices: number;
  totalServiceOrders: number;
  totalConsultants: number;
  totalClients: number;
  averageInvoiceValue: number;
  topPerformingConsultant: string;
  topClient: string;
}

interface DashboardData {
  current: DashboardMetrics;
  previous: DashboardMetrics;
  consultantTotals: ConsultantMonthlyTotal[];
  clientTotals: ClientMonthlyTotal[];
  invoices: Invoice[];
  serviceOrders: ServiceOrder[];
  consultants: User[];
  clients: Client[];
}

const DashboardTab: React.FC = () => {
  const theme = useTheme();
  const currentMonth = getCurrentMonth();
  const [selectedMonth, setSelectedMonth] = useState<Dayjs | null>(currentMonth);

  const getPreviousMonth = (month: Dayjs | null) => {
    return month ? month.subtract(1, 'month') : null;
  };

  const fetchInvoices = async (startDate: string, endDate: string): Promise<Invoice[]> => {
    let allInvoices: Invoice[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(
        `api/v1/invoice?startIssueDate=${startDate}&endIssueDate=${endDate}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch invoices');

      const data: PaginationResult<Invoice> = await response.json();
      allInvoices.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allInvoices;
  };

  const fetchServiceOrders = async (startDate: string, endDate: string): Promise<ServiceOrder[]> => {
    let allOrders: ServiceOrder[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(
        `api/v1/service-order?startRequestDate=${startDate}&endRequestDate=${endDate}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch service orders');

      const data: PaginationResult<ServiceOrder> = await response.json();
      allOrders.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allOrders;
  };

  const fetchConsultants = async (): Promise<User[]> => {
    let allConsultants: User[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(`api/v1/consultant?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch consultants');

      const data: PaginationResult<User> = await response.json();
      allConsultants.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allConsultants;
  };

  const fetchClients = async (): Promise<Client[]> => {
    let allClients: Client[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(`api/v1/client?limit=${limit}&offset=${offset}`);
      if (!response.ok) throw new Error('Failed to fetch clients');

      const data: PaginationResult<Client> = await response.json();
      allClients.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allClients;
  };

  const fetchConsultantMonthlyTotals = async (yearMonth: string): Promise<ConsultantMonthlyTotal[]> => {
    let allData: ConsultantMonthlyTotal[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(
        `api/v1/consultant/monthly-totals?start=${yearMonth}&end=${yearMonth}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch consultant monthly totals');

      const data: PaginationResult<ConsultantMonthlyTotal> = await response.json();
      allData.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allData;
  };

  const fetchClientMonthlyTotals = async (yearMonth: string): Promise<ClientMonthlyTotal[]> => {
    let allData: ClientMonthlyTotal[] = [];
    let offset = 0;
    const limit = 100;
    let hasNext = true;

    while (hasNext) {
      const response = await fetch(
        `api/v1/client/monthly-totals?start=${yearMonth}&end=${yearMonth}&limit=${limit}&offset=${offset}`
      );
      if (!response.ok) throw new Error('Failed to fetch client monthly totals');

      const data: PaginationResult<ClientMonthlyTotal> = await response.json();
      allData.push(...data.content);
      hasNext = data.hasNext;
      offset += limit;
    }
    return allData;
  };

  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', dayjsToYearMonth(selectedMonth)],
    queryFn: async (): Promise<DashboardData | null> => {
      if (!selectedMonth) return null;

      const yearMonth = dayjsToYearMonth(selectedMonth);
      const startDate = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const endDate = selectedMonth.endOf('month').format('YYYY-MM-DD');

      const previousMonth = getPreviousMonth(selectedMonth);
      const prevYearMonth = previousMonth ? dayjsToYearMonth(previousMonth) : null;
      const prevStartDate = previousMonth ? previousMonth.startOf('month').format('YYYY-MM-DD') : null;
      const prevEndDate = previousMonth ? previousMonth.endOf('month').format('YYYY-MM-DD') : null;

      const [
        invoices,
        serviceOrders,
        consultants,
        clients,
        consultantTotals,
        clientTotals,
        prevInvoices,
        prevConsultantTotals
      ] = await Promise.all([
        fetchInvoices(startDate, endDate),
        fetchServiceOrders(startDate, endDate),
        fetchConsultants(),
        fetchClients(),
        fetchConsultantMonthlyTotals(yearMonth),
        fetchClientMonthlyTotals(yearMonth),
        prevStartDate && prevEndDate ? fetchInvoices(prevStartDate, prevEndDate) : Promise.resolve([]),
        prevYearMonth ? fetchConsultantMonthlyTotals(prevYearMonth) : Promise.resolve([])
      ]);

      const totalRevenue = consultantTotals.reduce((sum, c) => sum + c.netValue, 0);
      const averageInvoiceValue = invoices.length > 0 ? totalRevenue / invoices.length : 0;

      const topConsultant = consultantTotals.reduce((top, current) =>
        current.netValue > (top?.netValue || 0) ? current : top, consultantTotals[0]);
      const topConsultantName = consultants.find(c => c.id === topConsultant?.userId)?.name || 'N/A';

      const topClient = clientTotals.reduce((top, current) =>
        current.netValue > (top?.netValue || 0) ? current : top, clientTotals[0]);
      const topClientObj = clients.find(c => c.clientId === topClient?.clientId);
      const topClientName = topClientObj?.companyName || topClientObj?.tradeName || 'N/A';

      const currentMetrics: DashboardMetrics = {
        totalRevenue,
        totalInvoices: invoices.length,
        totalServiceOrders: serviceOrders.length,
        totalConsultants: consultants.length,
        totalClients: clients.length,
        averageInvoiceValue,
        topPerformingConsultant: topConsultantName,
        topClient: topClientName
      };

      const prevTotalRevenue = prevConsultantTotals.reduce((sum, c) => sum + c.netValue, 0);
      const prevAverageInvoiceValue = prevInvoices.length > 0 ? prevTotalRevenue / prevInvoices.length : 0;

      const previousMetrics: DashboardMetrics = {
        totalRevenue: prevTotalRevenue,
        totalInvoices: prevInvoices.length,
        totalServiceOrders: 0,
        totalConsultants: consultants.length,
        totalClients: clients.length,
        averageInvoiceValue: prevAverageInvoiceValue,
        topPerformingConsultant: 'N/A',
        topClient: 'N/A'
      };

      return {
        current: currentMetrics,
        previous: previousMetrics,
        consultantTotals,
        clientTotals,
        invoices,
        serviceOrders,
        consultants,
        clients
      };
    },
    enabled: !!selectedMonth,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    change?: number;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  }> = ({ title, value, icon, change, color = 'primary' }) => (
    <Card sx={{ height: '100%', elevation: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${color}.100`,
            color: `${color}.main`,
            display: 'flex'
          }}>
            {icon}
          </Box>
          {change !== undefined && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {change > 0 ? (
                <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
              ) : (
                <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: change > 0 ? 'success.main' : 'error.main',
                  fontWeight: 600,
                  ml: 0.5
                }}
              >
                {Math.abs(change).toFixed(1)}%
              </Typography>
            </Box>
          )}
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
          {typeof value === 'number' && value > 1000 ? formatCurrency(value) : value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Erro ao carregar dados do dashboard: {error.message}
        </Alert>
      </Box>
    );
  }

  const chartColors = [
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
          Dashboard - {selectedMonth ? formatYearMonth({
            year: selectedMonth.year(),
            month: selectedMonth.month() + 1
          }) : ''}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <YearMonthPicker
            label="Selecionar Mês"
            value={selectedMonth}
            onChange={setSelectedMonth}
            size="small"
          />

          <Tooltip title="Atualizar dados">
            <IconButton
              onClick={() => refetch()}
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
          </Tooltip>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Carregando dados do dashboard...
            </Typography>
          </Box>
        </Box>
      )}

      {!isLoading && dashboardData && (
        <>
          {/* Key Metrics */}
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <MetricCard
                title="Receita Total"
                value={dashboardData.current.totalRevenue}
                icon={<MoneyIcon />}
                change={calculatePercentageChange(
                  dashboardData.current.totalRevenue,
                  dashboardData.previous.totalRevenue
                )}
                color="success"
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <MetricCard
                title="Faturas Emitidas"
                value={dashboardData.current.totalInvoices}
                icon={<InvoiceIcon />}
                change={calculatePercentageChange(
                  dashboardData.current.totalInvoices,
                  dashboardData.previous.totalInvoices
                )}
                color="primary"
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <MetricCard
                title="Ordens de Serviço"
                value={dashboardData.current.totalServiceOrders}
                icon={<ServiceOrderIcon />}
                color="secondary"
              />
            </Grid>

            <Grid size={{ xs: 4, sm: 4, md: 3 }}>
              <MetricCard
                title="Valor Médio por Fatura"
                value={dashboardData.current.averageInvoiceValue}
                icon={<TrendingUpIcon />}
                change={calculatePercentageChange(
                  dashboardData.current.averageInvoiceValue,
                  dashboardData.previous.averageInvoiceValue
                )}
                color="warning"
              />
            </Grid>
          </Grid>

          {/* Top Performers */}
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }} sx={{ mb: 4 }}>
            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <Card sx={{ elevation: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Destaques do Mês
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <PeopleIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Consultor Top
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {dashboardData.current.topPerformingConsultant}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <ClientIcon sx={{ color: 'secondary.main' }} />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Cliente Top
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {dashboardData.current.topClient}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 4, sm: 8, md: 6 }}>
              <Card sx={{ elevation: 2, height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Estatísticas Gerais
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Total de Consultores</Typography>
                      <Chip label={dashboardData.current.totalConsultants} color="primary" size="small" />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Total de Clientes</Typography>
                      <Chip label={dashboardData.current.totalClients} color="secondary" size="small" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
            {/* Consultant Performance Chart */}
            {dashboardData.consultantTotals.length > 0 && (
              <Grid size={{ xs: 4, sm: 8, md: 8 }}>
                <Card sx={{ elevation: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Performance dos Consultores
                    </Typography>
                    <Box sx={{ height: 400, width: '100%' }}>
                      <ResponsiveContainer>
                        <BarChart data={dashboardData.consultantTotals.map(consultant => ({
                          ...consultant,
                          name: dashboardData.consultants.find(c => c.id === consultant.userId)?.name || consultant.userId
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12 }}
                            stroke={theme.palette.text.secondary}
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis
                            tick={{ fontSize: 12 }}
                            stroke={theme.palette.text.secondary}
                            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                          />
                          <RechartsTooltip
                            formatter={(value: number) => [formatCurrency(value), 'Valor Líquido']}
                            itemStyle={{ color: 'text.secondary' }}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 8,
                            }}
                          />
                          <Bar dataKey="netValue" radius={[4, 4, 0, 0]}>
                            {dashboardData.consultantTotals.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Client Revenue Distribution */}
            {dashboardData.clientTotals.length > 0 && (
              <Grid size={{ xs: 4, sm: 8, md: 4 }}>
                <Card sx={{ elevation: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      Top 8 Clientes do Mês
                    </Typography>
                    <Box sx={{ height: 400, width: '100%' }}>
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie
                            data={dashboardData.clientTotals.slice(0, 8).map((clientTotal, index) => {
                              const client = dashboardData.clients.find(c => c.clientId === clientTotal.clientId);
                              const clientName = client?.companyName || client?.tradeName || `Cliente ${clientTotal.clientId}`;
                              return {
                                name: clientName,
                                value: clientTotal.netValue,
                                fill: chartColors[index % chartColors.length]
                              };
                            })}
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            innerRadius={60}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {dashboardData.clientTotals.slice(0, 8).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number) => [formatCurrency(value)]}
                            itemStyle={{ color: theme.palette.text.primary }}
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              borderRadius: 8,
                            }}
                          />
                          <Legend/>
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {!isLoading && !dashboardData && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum dado encontrado para o mês selecionado
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default DashboardTab;
