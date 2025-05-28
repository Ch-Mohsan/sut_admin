import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1F3965', // Deep blue
    },
    secondary: {
      main: '#F9603D', // Orange/Red
    },
    background: {
        default: '#FFEEE8', // Light background
        paper: '#FFFFFF', // Keep paper background white usually
    },
  },
  components: {
      MuiAppBar: {
          styleOverrides: {
              root: {
                  // You can add styles here to target the AppBar specifically if needed,
                  // but often relies on primary color by default.
              },
          },
      },
      MuiButton: {
          styleOverrides: {
              containedPrimary: {
                  // Styles for primary contained buttons
              },
              outlinedPrimary: {
                  // Styles for primary outlined buttons
              },
              containedSecondary: {
                  // Styles for secondary contained buttons
              },
              outlinedSecondary: {
                  // Styles for secondary outlined buttons
              },
          },
      },
      // Add more component overrides here if needed
  },
});

export default theme; 