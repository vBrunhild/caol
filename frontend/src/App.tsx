import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import { queryClient } from './lib/query';
import { lightTheme, darkTheme } from './theme';
import Navbar from './components/Navbar';
import DashboardTab from './components/DashboardTab';
import ConsultantTab from './components/ConsultantTab';
import ClientTab from './components/ClientTab';

dayjs.locale('pt-br');

type TabType = 'dashboard' | 'consultants' | 'clients';

export default function App() {
  const [isDark, setIsDark] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<TabType>('dashboard');

  const handleThemeToggle = () => {
    setIsDark(!isDark);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab key="dashboard" />;
      case 'consultants':
        return <ConsultantTab key="consultants" />;
      case 'clients':
        return <ClientTab key="clients" />;
      default:
        return <DashboardTab key="dashboard" />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        <Navbar
          onThemeToggle={handleThemeToggle}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <main style={{ padding: "1rem" }}>
          {renderActiveTab()}
        </main>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
