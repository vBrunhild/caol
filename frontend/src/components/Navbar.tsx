import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import Tooltip from "@mui/material/Tooltip";

type TabType = 'dashboard' | 'consultants' | 'clients';

interface NavbarProps {
  onThemeToggle: () => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Navbar({ onThemeToggle, activeTab, onTabChange }: NavbarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getButtonStyles = (tabName: TabType) => ({
    position: 'relative',
    '&::after': activeTab === tabName ? {
      content: '""',
      position: 'absolute',
      bottom: -8,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '60%',
      height: 3,
      backgroundColor: 'currentColor',
      borderRadius: '3px 3px 0 0',
    } : {},
    backgroundColor: activeTab === tabName ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  });

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            CAOL
          </Typography>

          {/* Navigation buttons */}
          <Button
            color="inherit"
            onClick={() => onTabChange('dashboard')}
            sx={getButtonStyles('dashboard')}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            onClick={() => onTabChange('consultants')}
            sx={getButtonStyles('consultants')}
          >
            Consultores
          </Button>
          <Button
            color="inherit"
            onClick={() => onTabChange('clients')}
            sx={getButtonStyles('clients')}
          >
            Clientes
          </Button>

          {/* Theme toggle button */}
          <Tooltip title={isDark ? "Alternar para tema claro" : "Alternar para tema escuro"}>
            <IconButton
              color="inherit"
              onClick={onThemeToggle}
              sx={{
                ml: 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
            >
              {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
    </Box>
  );
}
