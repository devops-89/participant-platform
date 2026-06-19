import { Box } from "@mui/material";
import React from "react";

interface LayoutProviderProps {
  children: React.ReactNode;
  isFullWidth?: boolean;
}

const LayoutProvider = ({ children, isFullWidth }: LayoutProviderProps) => {
  return (
    <Box
      sx={{
        ml: isFullWidth ? 0 : "250px",
        mt: isFullWidth ? 0 : "80px",
        px: isFullWidth ? 0 : 5,
        transition: "all 0.3s ease",
      }}
    >
      {children}
    </Box>
  );
};

export default LayoutProvider;
