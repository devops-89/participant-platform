"use client";
import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, IconButton, Tooltip, CircularProgress, Avatar } from "@mui/material";
import { useAppTheme } from "@/context/ThemeContext";
import { CloudUpload, Visibility, Edit } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import { entryControllers } from "@/api/entryControllers";
import { contestControllers } from "@/api/contestControllers";
import { useSnackbar } from "@/context/SnackbarContext";
import moment from "moment";

const Entries = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [entries, setEntries] = useState<any[]>([]);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [userFields, setUserFields] = useState<any[]>([]);
  const [contestTitle, setContestTitle] = useState<string>("Contest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        setLoading(true);
        
        let actualContestId = null;
        let fetchedContestTitle = "Contest";
        let templateFieldsFromApi: any[] = [];
        let userFieldsFromApi: any[] = [];
        
        let hasLocalContestData = false;
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.contests && user.contests.length > 0) {
              const contest = user.contests[0];
              actualContestId = contest.id;
              fetchedContestTitle = contest.title || contest.name || "Contest";
              
              if (contest.entryLevelTemplate?.schema?.fields) {
                templateFieldsFromApi = contest.entryLevelTemplate.schema.fields;
              }
              if (contest.userLevelTemplate?.schema?.fields) {
                userFieldsFromApi = contest.userLevelTemplate.schema.fields;
              }
              hasLocalContestData = true;
            } else if (user?.contestId) {
              actualContestId = user.contestId;
            }
          }
        } catch(e) {
          console.error("Error reading user from localStorage", e);
        }

        if (!hasLocalContestData) {
          const contestRes = await contestControllers.getContest();
          
          if (contestRes?.data?.docs && contestRes.data.docs.length > 0) {
            actualContestId = contestRes.data.docs[0].id;
            fetchedContestTitle = contestRes.data.docs[0].title || contestRes.data.docs[0].name || "Contest";
          } else if (Array.isArray(contestRes?.data) && contestRes.data.length > 0) {
            actualContestId = contestRes.data[0].id;
            fetchedContestTitle = contestRes.data[0].title || contestRes.data[0].name || "Contest";
          } else if (Array.isArray(contestRes) && contestRes.length > 0) {
            actualContestId = contestRes[0].id;
            fetchedContestTitle = contestRes[0].title || contestRes[0].name || "Contest";
          } else if (contestRes?.data?.id) {
            actualContestId = contestRes.data.id;
            fetchedContestTitle = contestRes.data.title || contestRes.data.name || "Contest";
          } else if (contestRes?.id) {
            actualContestId = contestRes.id;
            fetchedContestTitle = contestRes.title || contestRes.name || "Contest";
          }
        }

        if (!actualContestId) {
          setLoading(false);
          return; // Still no contest found
        }

        let res;
        if (!hasLocalContestData || templateFieldsFromApi.length === 0 || userFieldsFromApi.length === 0) {
          const [contestDetailsRes, entriesRes] = await Promise.all([
            contestControllers.getContestDetails(actualContestId),
            entryControllers.getAllEntries(actualContestId)
          ]);
          res = entriesRes;

          if (contestDetailsRes?.data?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestDetailsRes.data.entryLevelTemplate.schema.fields;
          } else if (contestDetailsRes?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestDetailsRes.entryLevelTemplate.schema.fields;
          }
  
          if (contestDetailsRes?.data?.userLevelTemplate?.schema?.fields) {
            userFieldsFromApi = contestDetailsRes.data.userLevelTemplate.schema.fields;
          } else if (contestDetailsRes?.userLevelTemplate?.schema?.fields) {
            userFieldsFromApi = contestDetailsRes.userLevelTemplate.schema.fields;
          }
        } else {
          res = await entryControllers.getAllEntries(actualContestId);
        }

        setTemplateFields(templateFieldsFromApi);
        setUserFields(userFieldsFromApi);
        setContestTitle(fetchedContestTitle);

        let dataList = [];
        if (Array.isArray(res?.data)) {
          dataList = res.data;
        } else if (Array.isArray(res?.data?.data)) {
          dataList = res.data.data;
        } else if (res?.data?.docs) {
          dataList = res.data.docs;
        } else if (res?.docs) {
          dataList = res.docs;
        }

        setEntries(dataList);

      } catch (error: any) {
        console.error("Failed to fetch entries:", error);
        showSnackbar(error?.response?.data?.message || "Failed to load entries.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchEntries();
  }, [showSnackbar]);

  const getEntryName = (entry: any) => {
    let entryTitle = "Untitled Entry";
    const entryData = entry?.submission?.data;
    if (entryData) {
      const titleField = templateFields.find((f: any) => f.label?.toLowerCase().includes("title") || f.label?.toLowerCase().includes("project"));
      if (titleField && entryData[titleField.id]) {
        entryTitle = entryData[titleField.id];
      } else {
        const firstText = templateFields.find((f: any) => f.type === 'textfield');
        if (firstText && entryData[firstText.id]) {
          entryTitle = entryData[firstText.id];
        }
      }
    }
    return entryTitle;
  };

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
        <Button 
          variant="contained" 
          startIcon={<CloudUpload />}
          onClick={() => router.push("/entries/add")}
          sx={{ bgcolor: colors.PRIMARY, textTransform: 'none', borderRadius: 2 }}
        >
          Submit New Entry
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${colors.BORDER}`, borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "rgba(0,0,0,0.02)" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Thumbnail</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
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
                
                const entryTitleField = templateFields?.find((f: any) => {
                  const l = f.label?.toLowerCase() || "";
                  return l.includes("title") || l.includes("project") || l.includes("name");
                });
                const entryTitle = entryTitleField ? (subData[entryTitleField.label] || subData[entryTitleField.id]) : (subData.ho1p00z0q || subData["Innovation Title"]);

                const firstNameField = userFields.find((f: any) => {
                  const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                  return l.includes("firstname") || l === "first";
                });
                const lastNameField = userFields.find((f: any) => {
                  const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                  return l.includes("lastname") || l === "last";
                });
                const fullNameField = userFields.find((f: any) => {
                  const l = f.label?.toLowerCase().replace(/\s+/g, '') || "";
                  return l.includes("fullname") || l === "name" || (l.includes("name") && !l.includes("first") && !l.includes("last"));
                });

                const rawAuthorData = entry?.participant?.submission?.data;
                const authorData = rawAuthorData?.data || rawAuthorData || (entry?.participant as any)?.data || (entry?.participant as any)?.participant_profile_data || {};
                let authorName = "";

                if (firstNameField || lastNameField) {
                  const first = firstNameField ? (authorData[firstNameField.label] || authorData[firstNameField.id]) : "";
                  const last = lastNameField ? (authorData[lastNameField.label] || authorData[lastNameField.id]) : "";
                  authorName = `${first || ""} ${last || ""}`.trim();
                }
                
                if (!authorName && fullNameField) {
                  authorName = authorData[fullNameField.label] || authorData[fullNameField.id];
                }

                if (!authorName) {
                  const fallback = userFields.find((f: any) => f.label?.toLowerCase().includes("name"));
                  if (fallback && (authorData[fallback.label] || authorData[fallback.id])) {
                    authorName = authorData[fallback.label] || authorData[fallback.id];
                  } else {
                    authorName = authorData.yg9snrxlh;
                  }
                }

                const thumbnailField = templateFields?.find((f: any) => f.label?.toLowerCase().includes("thumbnail"));
                let thumbnailUrl = "";
                if (thumbnailField) {
                  thumbnailUrl = subData[`${thumbnailField.id}_downloadUrl`] || subData[`${thumbnailField.label}_downloadUrl`] || subData[thumbnailField.id] || subData[thumbnailField.label] || "";
                }
                
                if (!thumbnailUrl) {
                  const downloadUrlKey = Object.keys(subData).find((key) => key.endsWith("_downloadUrl"));
                  thumbnailUrl = downloadUrlKey ? subData[downloadUrlKey] : "";
                }
                
                if (!thumbnailUrl) {
                  const imageUrlKey = Object.keys(subData).find((key) => {
                    if (key === "status" || key.endsWith("_downloadUrl")) return false;
                    const val = subData[key];
                    return typeof val === "string" && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(val);
                  });
                  if (imageUrlKey) thumbnailUrl = subData[imageUrlKey];
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
                        const isEvaluatedBackend = displayStatus.toLowerCase() === "evaluated" || (entry.score !== undefined && entry.score !== null && entry.score > 0);

                        const getStatusColor = (status: string) => {
                          const lower = status.toLowerCase();
                          if (lower === "draft") return { bg: "#f1f5f9", text: "#475569" };      // Slate
                          if (lower === "pending") return { bg: "#fef3c7", text: "#b45309" };    // Amber
                          if (lower === "approved") return { bg: "#d1fae5", text: "#047857" };   // Emerald
                          if (lower === "rejected") return { bg: "#fee2e2", text: "#b91c1c" };   // Red
                          if (lower === "evaluated") return { bg: "#e0f2fe", text: "#0369a1" };  // Sky Blue
                          if (lower === "semifinal") return { bg: "#f3e8ff", text: "#6b21a8" };  // Purple
                          if (lower === "final") return { bg: "#fce7f3", text: "#be185d" };      // Pink
                          if (lower === "winner") return { bg: "#fef08a", text: "#a16207" };     // Gold
                          return { bg: "#f8fafc", text: "#64748b" };
                        };

                        const statusColors = getStatusColor(isEvaluatedBackend ? "evaluated" : displayStatus);
                        
                        let uiStatus = displayStatus;
                        if (isEvaluatedBackend) uiStatus = "Evaluated";
                        else if (displayStatus.toLowerCase() === "approved") uiStatus = "Moderate";

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
                      {entry.status?.toLowerCase() === "draft" && (
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
    </Box>
  );
};

export default Entries;
