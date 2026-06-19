"use client";

import { LIGHT_COLORS } from "@/utils/enum";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import React, {
    createContext,
    useContext,
    useMemo
} from "react";

interface ThemeContextType {
  mode: "light" | "dark";
  colors: typeof LIGHT_COLORS;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const mode = "light";
  const colors = LIGHT_COLORS;

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: colors.PRIMARY },
          secondary: { main: colors.SECONDARY },
          background: {
            default: colors.BACKGROUND,
            paper: colors.SURFACE,
          },
          text: {
            primary: colors.TEXT_PRIMARY,
            secondary: colors.TEXT_SECONDARY,
          },
          error: { main: colors.ERROR },
        },
        typography: {
          fontFamily: "var(--font-science-gothic), sans-serif",
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                textTransform: "none",
                borderRadius: 8,
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                backgroundImage: "none",
              },
            },
          },
        },
      }),
    [mode, colors],
  );

  return (
    <ThemeContext.Provider value={{ mode, colors }}>
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <ThemeProvider theme={muiTheme}>{children}</ThemeProvider>
      </LocalizationProvider>
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useAppTheme must be used within a ThemeContextProvider");
  }
  return context;
};
