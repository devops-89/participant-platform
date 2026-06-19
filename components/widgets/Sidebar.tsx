"use client";
import {
  Box,
  Collapse,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Dashboard, Person, EmojiEvents, UploadFile, EmojiEventsOutlined, Notifications } from "@mui/icons-material";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const PARTICIPANT_SIDEBAR = [
  {
    label: "Dashboard",
    icon: Dashboard,
    href: "/dashboard",
  },
  {
    label: "Contests",
    icon: EmojiEvents,
    href: "/contests",
  },
  {
    label: "My Entries",
    icon: UploadFile,
    href: "/entries",
  },
];

const Sidebar = () => {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <Box>
      <Box
        sx={{
          width: "250px",
          height: "100vh",
          boxShadow: "0px 0px 2px 2px #d7d7d7",
          backgroundColor: "#fff",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 999,
        }}
      >
        <Box sx={{ textAlign: "center", pt: 2 }}>
          <Box sx={{ borderBottom: "1px solid #d7d7d7", pb: 2 }}>
            <Typography variant="h6">Participant Platform</Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <List component="nav">
              {PARTICIPANT_SIDEBAR.map((val, i) => (
                <ListItemButton
                  key={i}
                  onClick={() => val.href && handleNavigate(val.href)}
                  sx={{
                    borderRadius: "8px",
                    mb: 0.5,
                    "&:hover": {
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  {val.icon && (
                    <Box sx={{ mr: 2, display: "flex" }}>
                      <val.icon fontSize="small" />
                    </Box>
                  )}
                  <ListItemText
                    primary={val.label}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.9rem",
                          fontWeight: 500,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
