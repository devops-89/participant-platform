"use client";
import { AuthControllers } from "@/api/authControllers";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import { useSnackbar } from "@/context/SnackbarContext";
import { useAppTheme } from "@/context/ThemeContext";
import { CloudUpload, Edit, Visibility } from "@mui/icons-material";
import { Avatar, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, IconButton, InputLabel, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from "@mui/material";

interface TemplateField { id: string; label?: string; type?: string; [key: string]: unknown; }
interface Contest { id?: string; _id?: string; name?: string; title?: string; status?: string; entryLevelTemplate?: { schema?: { fields?: TemplateField[] } }; userLevelTemplate?: { schema?: { fields?: TemplateField[] } }; [key: string]: unknown; }
interface Entry { id?: string; status?: string; score?: number; contest_id?: string; contest?: Contest; participant?: { status?: string; [key: string]: unknown; }; submission?: { data?: Record<string, string> }; [key: string]: unknown; }

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
const Entries = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [entries, setEntries] = useState<Entry[]>([]);

  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [contestPopupOpen, setContestPopupOpen] = useState(false);
  const [selectedContestIdPopup, setSelectedContestIdPopup] = useState<string>("");

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        let userObj: { status?: string; participants?: Array<{ status?: string; contest?: { status?: string }; entries?: unknown[] }> } | null = null;
        
        try {
          const meRes = await AuthControllers.getParticipants();
          if (meRes?.data) {
            userObj = meRes.data;
            sessionStorage.setItem("user", JSON.stringify(userObj));
          }
        } catch (e) {
          console.error("Failed to fetch /me", e);
        }

        if (!userObj) {
          try {
            const userStr = sessionStorage.getItem("user");
            if (userStr) userObj = JSON.parse(userStr);
          } catch {}
        }

        if (userObj) {
          if (userObj.status === "Banned" || userObj.status === "banned") {
            setIsBanned(true);
          }
          if (userObj.participants && userObj.participants.length > 0) {
            const active = userObj.participants.filter(
              (p) => p.status !== "Banned" && p.status !== "banned" && p.status !== "rejected" && p.status !== "Rejected" && p.contest && (p.contest.status === "Published" || p.contest.status === "published")
            );
            setActiveContests(active.map((p) => p.contest as Contest));

            const allEntries = active.flatMap(p => {
              if (p.entries && Array.isArray(p.entries)) {
                return p.entries.map((entry: unknown) => ({
                  ...(typeof entry === 'object' && entry ? entry : {}),
                  contest: p.contest,
                  participant: p
                }));
              }
              return [];
            });

            setEntries(allEntries);
          }
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        console.error("Failed to fetch entries:", err);
        showSnackbar(err?.response?.data?.message || "Failed to load entries.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [showSnackbar]);



  return (
    <Box sx={{ p: 4, mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Breadcrumb
          title="My Entries"
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Entries", href: "/entries" },
          ]}
        />
        {!isBanned && (
          <Button 
            variant="contained" 
            startIcon={<CloudUpload />}
            onClick={() => {
              if (activeContests.length > 1) {
                setContestPopupOpen(true);
              } else if (activeContests.length === 1) {
                const contestId = activeContests[0].id || activeContests[0]._id;
                const hasEntry = entries.some((entry) => entry.contest_id === contestId || (entry.contest?.id || entry.contest?._id) === contestId);
                if (hasEntry) {
                  showSnackbar("You have already submitted an entry for this contest.", "warning");
                } else {
                  router.push(`/entries/add?contestId=${contestId}`);
                }
              } else {
                router.push("/entries/add");
              }
            }}
            sx={{ bgcolor: colors.PRIMARY, textTransform: 'none', borderRadius: 2 }}
          >
            Submit New Entry
          </Button>
        )}
      </Box>

      {isBanned ? (
        <Paper elevation={0} sx={{ p: 5, textAlign: "center", border: `1px solid ${colors.BORDER}`, borderRadius: 3, bgcolor: "#fee2e2" }}>
          <Typography variant="h6" sx={{ color: "#991b1b", fontWeight: 600 }}>
            You have been banned from participating in this contest.
          </Typography>
          <Typography variant="body2" sx={{ color: "#7f1d1d", mt: 1 }}>
            You cannot view or submit any entries.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${colors.BORDER}`, borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contest</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Score</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={30} sx={{ color: colors.PRIMARY }} />
                </TableCell>
              </TableRow>
            ) : entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">No entries found.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const subData = entry?.submission?.data || {};
                const contest = entry?.contest || {};
                
                let currentTemplateFields: TemplateField[] = [];

                if (contest?.entryLevelTemplate?.schema?.fields) {
                  currentTemplateFields = contest.entryLevelTemplate.schema.fields;
                }
                
                const entryTitleField = currentTemplateFields.find((f) => {
                  const l = f.label?.toLowerCase() || "";
                  return l.includes("title") || l.includes("project") || l.includes("name");
                });
                const entryTitleRaw = entryTitleField ? (subData[entryTitleField.label || ""] || subData[entryTitleField.id]) : (subData.ho1p00z0q || subData["Innovation Title"] || "");
                const entryTitle = typeof entryTitleRaw === "string" ? entryTitleRaw : String(entryTitleRaw || "");

                let authorName = "Unknown";
                try {
                  const uStr = sessionStorage.getItem("user");
                  if (uStr) {
                    const u = JSON.parse(uStr);
                    authorName = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown";
                  }
                } catch {}

                const thumbnailField = currentTemplateFields.find((f) => f.label?.toLowerCase().includes("thumbnail") || f.label?.toLowerCase().includes("image"));
                let thumbnailUrl = "";
                if (thumbnailField) {
                  thumbnailUrl = subData[`${thumbnailField.id}_downloadUrl`] || subData[`${thumbnailField.label || ""}_downloadUrl`] || subData[thumbnailField.id] || subData[thumbnailField.label || ""] || "";
                }
                
                if (!thumbnailUrl) {
                  const imageKeys = Object.keys(subData).filter((key) => {
                    if (key === "status" || key.endsWith("_downloadUrl")) return false;
                    const val = subData[key];
                    return typeof val === "string" && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(val);
                  });
                  if (imageKeys.length > 0) {
                    thumbnailUrl = subData[`${imageKeys[0]}_downloadUrl`] || subData[imageKeys[0]];
                  }
                }

                // Fallback to any download url if it looks like an image URL
                if (!thumbnailUrl) {
                  const downloadUrlKey = Object.keys(subData).find((key) => {
                     if (!key.endsWith("_downloadUrl")) return false;
                     const val = subData[key];
                     return typeof val === "string" && /\.(png|jpe?g|gif|webp|svg|bmp)/i.test(val);
                  });
                  thumbnailUrl = downloadUrlKey ? subData[downloadUrlKey] : "";
                }

                return (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Avatar
                        variant="rounded"
                        src={thumbnailUrl}
                        onClick={() => router.push(`/entries/${entry.id}`)}
                        sx={{
                          width: 50,
                          height: 30,
                          cursor: "pointer",
                          "&:hover": { opacity: 0.8, transform: "scale(1.1)" },
                          transition: "all 0.2s ease",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
                        {entryTitle || "Untitled"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.TEXT_PRIMARY, fontWeight: 500 }}>
                        {contest?.name || contest?.title || "Unknown Contest"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.TEXT_PRIMARY }}>
                        {authorName || "Unknown"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: 13 }}>
                      {entry.score !== undefined && entry.score !== null ? entry.score : 0}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const displayStatus = entry.status || "Pending";
                        let finalStatus = displayStatus;
                        if (["pending", "approved"].includes(displayStatus.toLowerCase()) && entry.score !== undefined && entry.score !== null && entry.score > 0) {
                          finalStatus = "evaluated";
                        }

                        const getStatusColor = (status: string) => {
                          const lower = status.toLowerCase();
                          if (lower === "draft") return { bg: "#f1f5f9", text: "#475569" };      // Slate
                          if (lower === "pending") return { bg: "#fef3c7", text: "#b45309" };    // Amber
                          if (lower === "approved") return { bg: "#d1fae5", text: "#047857" };   // Emerald
                          if (lower === "rejected" || lower === "reject") return { bg: "#fee2e2", text: "#b91c1c" };   // Red
                          if (lower === "evaluated" || lower === "evaluate") return { bg: "#e0f2fe", text: "#0369a1" };  // Sky Blue
                          if (lower === "semifinal") return { bg: "#f3e8ff", text: "#6b21a8" };  // Purple
                          if (lower === "final") return { bg: "#fce7f3", text: "#be185d" };      // Pink
                          if (lower === "winner") return { bg: "#fef08a", text: "#a16207" };     // Gold
                          return { bg: "#f8fafc", text: "#64748b" };
                        };

                        const statusColors = getStatusColor(finalStatus);
                        
                        const getMappedStatus = (status: string) => {
                          if (!status) return "Pending";
                          switch (status.toLowerCase()) {
                            case 'pending': return 'Pending';
                            case 'approved': return 'Moderate';
                            case 'evaluate': 
                            case 'evaluated': return 'Evaluated';
                            case 'semifinal': return 'Semifinalist';
                            case 'final': return 'Finalist';
                            case 'winner': return 'Winner';
                            case 'reject': 
                            case 'rejected': return 'Rejected';
                            case 'draft': return 'Draft';
                            default: return status.charAt(0).toUpperCase() + status.slice(1);
                          }
                        };
                        const uiStatus = getMappedStatus(finalStatus);

                        return (
                          <Chip 
                            label={uiStatus}
                            size="small"
                            sx={{ 
                              bgcolor: statusColors.bg,
                              color: statusColors.text,
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              fontSize: '0.75rem',
                              borderRadius: "6px",
                              height: 24,
                            }}
                          />
                        );
                      })()}
                    </TableCell>

                    <TableCell align="right">
                      {entry.status?.toLowerCase() === "draft" && 
                       !isBanned &&
                       entry.participant?.status?.toLowerCase() !== "banned" &&
                       (contest?.status === "Published" || contest?.status === "published") && (
                        <Tooltip title="Edit Draft">
                          <IconButton component={Link} href={`/entries/edit/${entry.id}`} color="secondary">
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="View Details">
                        <IconButton component={Link} href={`/entries/${entry.id}`} color="primary">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      )}

      <Dialog open={contestPopupOpen} onClose={() => setContestPopupOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Select Contest</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: "text.secondary" }}>
            Please select the contest you want to submit an entry for.
          </Typography>
          <FormControl fullWidth size="small">
            <InputLabel id="select-contest-popup-label">Select Contest</InputLabel>
            <Select
              labelId="select-contest-popup-label"
              value={selectedContestIdPopup}
              label="Select Contest"
              onChange={(e) => setSelectedContestIdPopup(e.target.value as string)}
            >
              {activeContests.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name || c.title || "Contest"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setContestPopupOpen(false)} color="inherit">Cancel</Button>
          <Button 
            onClick={() => {
              const hasEntry = entries.some((entry) => entry.contest_id === selectedContestIdPopup || (entry.contest?.id || entry.contest?._id) === selectedContestIdPopup);
              if (hasEntry) {
                showSnackbar("You have already submitted an entry for this contest.", "warning");
                setContestPopupOpen(false);
              } else {
                router.push(`/entries/add?contestId=${selectedContestIdPopup}`);
              }
            }} 
            color="primary" 
            variant="contained"
            disabled={!selectedContestIdPopup}
          >
            Proceed
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Entries;
