"use client";
import { useAppTheme } from "@/context/ThemeContext";
import { Box, Card, CardContent, Chip, Grid, Typography, CircularProgress, Stack, Button } from "@mui/material";
import { CalendarToday, Public, EmojiEvents } from "@mui/icons-material";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { contestControllers } from "@/api/contestControllers";
import dayjs from "dayjs";
import { montserrat } from "@/utils/fonts";

const Contests = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        setLoading(true);
        const res = await contestControllers.getContest();
        if (res?.data?.docs) {
          setContests(res.data.docs);
        }
      } catch (error) {
        console.error("Failed to fetch contests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchContests();
  }, []);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, mt: { xs: 8, md: 10 }, minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title="My Contests"
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Contests", href: "/contests" },
          ]}
        />
        <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
          View details about your active contest.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress size={40} sx={{ color: colors.PRIMARY }} />
        </Box>
      ) : contests.length === 0 ? (
        <Card sx={{ p: 6, textAlign: "center", borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.05)" }}>
          <Typography variant="h6" sx={{ color: colors.TEXT_SECONDARY }}>
            No contests available at the moment.
          </Typography>
        </Card>
      ) : (
        <Stack spacing={4}>
          {contests.map((contest) => (
            <Card 
              key={contest.id}
              elevation={0} 
              sx={{ 
                border: `1px solid ${colors.BORDER}`,
                borderRadius: 4,
                backgroundColor: "#ffffff",
                overflow: "hidden",
                boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Decorative Header Banner */}
              <Box 
                sx={{ 
                  height: { xs: 100, md: 120 }, 
                  background: `linear-gradient(135deg, ${colors.PRIMARY} 0%, #1e293b 100%)`,
                  display: "flex",
                  alignItems: "center",
                  px: { xs: 2, md: 4 }
                }}
              >
                <EmojiEvents sx={{ color: "rgba(255,255,255,0.2)", fontSize: { xs: 50, md: 80 }, mr: { xs: 1, md: 2 } }} />
                <Typography 
                  variant="h3" 
                  sx={{ 
                    color: "white", 
                    fontWeight: 800, 
                    fontFamily: montserrat.style.fontFamily,
                    letterSpacing: "-0.5px",
                    fontSize: { xs: "1.5rem", sm: "2rem", md: "3rem" }
                  }}
                >
                  {contest.name}
                </Typography>
              </Box>

              <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                <Grid container spacing={4}>
                  <Grid size={{xs:12, md:8}}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        color: "#0f172a", 
                        mb: 2,
                        fontFamily: montserrat.style.fontFamily,
                      }}
                    >
                      About the Contest
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: "#475569", 
                        mb: 4,
                        lineHeight: 1.8,
                        fontSize: "1.05rem"
                      }}
                    >
                      {contest.description}
                    </Typography>

                    <Button
                      variant="contained"
                      onClick={() => router.push('/entries/add')}
                      sx={{
                        backgroundColor: colors.PRIMARY,
                        color: "#fff",
                        px: 4,
                        py: 1.5,
                        width: { xs: "100%", sm: "auto" },
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          backgroundColor: colors.PRIMARY,
                          opacity: 0.9,
                        }
                      }}
                    >
                      Submit Your Entry
                    </Button>
                  </Grid>

                  <Grid size={{xs:12, md:4}}>
                    <Box sx={{ backgroundColor: "#f8fafc", p: 3, borderRadius: 3, border: "1px solid #e2e8f0" }}>
                      <Typography variant="subtitle2" sx={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "1px", mb: 2, fontWeight: 700 }}>
                        Contest Details
                      </Typography>

                      <Stack spacing={3}>


                        <Box>
                          <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}>Schedule</Typography>
                          <Box sx={{ display: "flex", alignItems: "center", color: "#0f172a" }}>
                            <CalendarToday sx={{ fontSize: 18, mr: 1, color: colors.PRIMARY }} />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {dayjs(contest.start_date).format('MMM DD, YYYY')} - {dayjs(contest.end_date).format('MMM DD, YYYY')}
                            </Typography>
                          </Box>
                        </Box>

                        {contest.available_regions && contest.available_regions.length > 0 && (
                          <Box>
                            <Typography variant="caption" sx={{ color: "#94a3b8", display: "block", mb: 0.5 }}>Eligible Regions</Typography>
                            <Box sx={{ display: "flex", alignItems: "center", color: "#0f172a" }}>
                              <Public sx={{ fontSize: 18, mr: 1, color: colors.PRIMARY }} />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {contest.available_regions.join(", ")}
                              </Typography>
                            </Box>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default Contests;
