// import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { queryClient } from './lib/query';

import Navbar from './components/ui/Navbar';

const theme = createTheme({
  typography: {
    fontFamily: "Inter, sans-serif",
    h1: { fontFamily: "Poppins, sans-serif" },
    h2: { fontFamily: "Poppins, sans-serif" }
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
          <Navbar />
          <main style={{ padding: "1rem" }}>
            Hello
          </main>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
