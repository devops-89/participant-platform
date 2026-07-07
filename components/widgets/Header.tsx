"use client";
import { AuthControllers } from "@/api/authControllers";
import { useAppTheme } from "@/context/ThemeContext";
import { LogoutOutlined } from "@mui/icons-material";
import { Avatar, Box, Button, Paper, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useSnackbar } from "@/context/SnackbarContext";

const Header = () => {
  const { colors } = useAppTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userName, setUserName] = useState("Participant");

  const router = useRouter();
  const [userAvatar, setUserAvatar] = useState("");
  const { showSnackbar } = useSnackbar();

  const handleLogout = async () => {
    try {
      const refreshToken = sessionStorage.getItem("refreshToken") || "";
      await AuthControllers.logout({ refreshToken });
    } catch (err) {
      console.error("Logout API failed, continuing with local cleanup...", err);
    }
    
    sessionStorage.setItem("intentionalLogout", "true");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    showSnackbar("Logged out successfully!", "success");
    router.push("/");
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);

    const token = sessionStorage.getItem("accessToken");
    if (!token) {
      router.push("/");
      return;
    }

    const fetchUserData = async () => {
      try {
        const participantRes = await AuthControllers.getParticipants();
        const userData = participantRes?.data?.data || participantRes?.data || participantRes;
        
        if (userData?.fullName) {
          setUserName(userData.fullName);
        } else if (userData?.firstName || userData?.lastName) {
          setUserName(`${userData.firstName || ""} ${userData.lastName || ""}`.trim());
        }
        
        if (userData?.email) {

        }
        
        // Attempt to find an uploaded image in the submission data
        let foundAvatar = "";
        const subData = (userData?.participant_profile_data && Object.keys(userData.participant_profile_data).length > 0)
          ? userData.participant_profile_data
          : (userData?.participantProfile?.submission?.data || userData?.participants?.[0]?.submission?.data);
        if (subData) {
          const imageKey = Object.keys(subData).find((k) => k.endsWith('_downloadUrl'));
          if (imageKey) {
            foundAvatar = subData[imageKey];
          } else if (subData['file_downloadUrl']) {
            foundAvatar = subData['file_downloadUrl'];
          } else if (subData['file']) {
            foundAvatar = subData['file'];
          }
        }

        if (foundAvatar) {
          setUserAvatar(foundAvatar);
        } else if (userData?.avatarDownloadUrl) {
          setUserAvatar(userData.avatarDownloadUrl);
        } else if (userData?.avatarUrl) {
          setUserAvatar(userData.avatarUrl);
        }
      } catch (error) {
        console.error("Failed to fetch participant details for header", error);
        
        // Fallback to local storage if API fails
        const userStr = sessionStorage.getItem("user");
        if (userStr) {
           const localUser = JSON.parse(userStr);

           if (localUser.firstName || localUser.lastName) {
             setUserName(`${localUser.firstName || ""} ${localUser.lastName || ""}`.trim());
           } else if (localUser.name) {
             setUserName(localUser.name);
           }
        }
      }
    };

    fetchUserData();

    const handleProfileUpdate = () => fetchUserData();
    window.addEventListener("profileUpdated", handleProfileUpdate);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("profileUpdated", handleProfileUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 2,
          position: "fixed",
          top: 0,
          right: 0,
          left: 250,
          zIndex: 1000,
          height: 65,
          px: 3,
          transition:
            "background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease",
          ...(scrolled
            ? {
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                bgcolor: `${colors.BACKGROUND}cc`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                borderBottom: `1px solid ${colors.BORDER}`,
              }
            : {
                bgcolor: colors.BACKGROUND,
                borderBottom: `1px solid ${colors.BORDER}`,
              }),
        }}
      >
        {/* Settings Icon */}
        {/* <Tooltip title="Settings">
          <IconButton
            size="small"
            sx={{
              color: colors.TEXT_SECONDARY,
              "&:hover": { color: colors.TEXT_PRIMARY, bgcolor: colors.BORDER },
            }}
          >
            <Settings fontSize="small" />
          </IconButton>
        </Tooltip> */}

        {/* Profile Avatar with gradient ring and hover menu */}
        <Box
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
          sx={{ position: "relative", py: 1 }}
        >
            <Box
              sx={{
                p: "2px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #f06, #a855f7, #3b82f6)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": { opacity: 0.9 },
                transition: "opacity 0.2s ease",
              }}
            >
              <Avatar
                src={userAvatar || undefined}
                sx={{
                  width: 34,
                  height: 34,
                  border: `2px solid ${colors.BACKGROUND}`,
                  bgcolor: !userAvatar ? colors.PRIMARY : undefined,
                  color: !userAvatar ? "#fff" : undefined,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                {!userAvatar && userName ? userName.charAt(0).toUpperCase() : null}
              </Avatar>
            </Box>

          {/* Hover Menu */}
          <Box
            sx={{
              position: "absolute",
              top: "100%",
              right: 0,
              pt: 0.5, // gap
              opacity: menuOpen ? 1 : 0,
              visibility: menuOpen ? "visible" : "hidden",
              transform: menuOpen ? "translateY(0)" : "translateY(-10px)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              zIndex: 1100,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                minWidth: 100,
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                bgcolor: `${colors.BACKGROUND}e6`,
                borderRadius: 3,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                border: `1px solid ${colors.BORDER}`,
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1.5, pb: 1, borderBottom: `1px solid ${colors.BORDER}` }}>
                <Box>
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      fontWeight: 600, 
                      color: colors.TEXT_PRIMARY,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {userName}
                  </Typography>
                </Box>
              </Box>

              <Button
                variant="text"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/profile");
                }}
                sx={{
                  justifyContent: "flex-start",
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  color: colors.TEXT_PRIMARY,
                  "&:hover": {
                    bgcolor: "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Profile
              </Button>

              <Button
                variant="text"
                color="error"
                startIcon={<LogoutOutlined />}
                onClick={handleLogout}
                sx={{
                  justifyContent: "flex-start",
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  color: "#ef4444",
                  "&:hover": {
                    bgcolor: "rgba(239, 68, 68, 0.08)",
                  },
                }}
              >
                Logout
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Header;
