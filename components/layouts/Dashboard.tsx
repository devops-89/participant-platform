"use client";
import { useAppTheme } from "@/context/ThemeContext";
import { CheckCircleOutlined, EmojiEvents, UploadFile } from "@mui/icons-material";
import { Box, Grid, Paper, Typography, CircularProgress } from "@mui/material";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import { useEffect, useState } from "react";
import { contestControllers } from "@/api/contestControllers";
import { entryControllers } from "@/api/entryControllers";

const Dashboard = () => {
  const { colors } = useAppTheme();

  const [statsData, setStatsData] = useState({
    activeContests: 0,
    totalEntries: 0,
    latestEntryStatus: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        let contestCount = 0;
        let entriesCount = 0;
        let latestStatus = "";

        try {
          const contestRes = await contestControllers.getContest();
          const contests = contestRes?.data?.docs || contestRes?.data || contestRes || [];
          if (Array.isArray(contests)) {
             contestCount = contests.length;
          } else if (contestRes?.data?.totalDocs) {
             contestCount = contestRes.data.totalDocs;
          }
        } catch(e) {
          console.error("Failed to fetch contests", e);
        }

        let actualContestId = null;
        let hasLocalContestData = false;
        
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.contests && user.contests.length > 0) {
              const contest = user.contests[0];
              actualContestId = contest.id;
              hasLocalContestData = true;
            } else if (user?.contestId) {
              actualContestId = user.contestId;
            }
          }
        } catch(e) {}

        if (!hasLocalContestData) {
          try {
            const contestRes = await contestControllers.getContest();
            
            if (contestRes?.data?.docs && contestRes.data.docs.length > 0) {
              actualContestId = contestRes.data.docs[0].id;
            } else if (Array.isArray(contestRes?.data) && contestRes.data.length > 0) {
              actualContestId = contestRes.data[0].id;
            } else if (Array.isArray(contestRes) && contestRes.length > 0) {
              actualContestId = contestRes[0].id;
            } else if (contestRes?.data?.id) {
              actualContestId = contestRes.data.id;
            } else if (contestRes?.id) {
              actualContestId = contestRes.id;
            }
          } catch(e) {}
        }

        if (actualContestId) {
          try {
            const entryRes = await entryControllers.getAllEntries(actualContestId);
            let entries = [];
            if (Array.isArray(entryRes?.data)) {
              entries = entryRes.data;
            } else if (Array.isArray(entryRes?.data?.data)) {
              entries = entryRes.data.data;
            } else if (entryRes?.data?.docs) {
              entries = entryRes.data.docs;
            } else if (entryRes?.docs) {
              entries = entryRes.docs;
            }
            
            entriesCount = entries.length;
            if (entries.length > 0) {
              latestStatus = entries[0].status || "";
            }
          } catch(e) {
            console.error("Failed to fetch entries", e);
          }
        }

        setStatsData({
          activeContests: contestCount,
          totalEntries: entriesCount,
          latestEntryStatus: latestStatus
        });
      } catch (error) {
        console.error("Dashboard data fetch error", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getMappedStatus = (status: string) => {
    if (!status) return "N/A";
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending';
      case 'approved': return 'Moderate';
      case 'evaluate': return 'Evaluated';
      case 'semifinal': return 'Semifinalist';
      case 'final': return 'Finalist';
      case 'winner': return 'Winner';
      case 'reject': return 'Rejected';
      case 'draft': return 'Draft';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const stats = [
    { title: "Active Contests", value: loading ? "..." : statsData.activeContests.toString(), icon: EmojiEvents, color: "#4ade80" },
    { title: "My Entries", value: loading ? "..." : statsData.totalEntries.toString(), icon: UploadFile, color: "#60a5fa" },
    { title: "Entry Status", value: loading ? "..." : getMappedStatus(statsData.latestEntryStatus), icon: CheckCircleOutlined, color: "#f472b6" },
  ];

  return (
    <Box sx={{ p: 4, mt: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title="Welcome to Dashboard"
          data={[
            { title: "Dashboard", href: "/dashboard" },
          ]}
        />
      </Box>

      <Grid container spacing={3}>
        {stats.map((stat, index) => (
          <Grid size={{xs:12,sm:4}} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                border: `1px solid ${colors.BORDER}`,
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  backgroundColor: `${stat.color}20`,
                  color: stat.color,
                  mr: 3,
                }}
              >
                <stat.icon fontSize="large" />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: "bold", color: colors.TEXT_PRIMARY }}>
                  {stat.value}
                </Typography>
                <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                  {stat.title}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;
