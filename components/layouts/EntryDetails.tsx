"use client";
import { contestControllers } from "@/api/contestControllers";
import { entryControllers } from "@/api/entryControllers";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import { useSnackbar } from "@/context/SnackbarContext";
import { useAppTheme } from "@/context/ThemeContext";
import {
  AccountCircle,
  ArrowBack,
  CalendarToday,
  CheckCircle,
  Download,
  EmojiEvents,
  Info,
  InsertDriveFile,
  Mail,
  Phone,
  Star,
  Tune,
} from "@mui/icons-material";
import { Avatar, Box, Button, Card, Chip, CircularProgress, Grid, Paper, Rating, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

const EntryDetails = ({ entryId }: { entryId: string }) => {
  const { colors } = useAppTheme();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  
  const [entry, setEntry] = useState<any>(null);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        let actualContestId = null;
        let templateFieldsFromApi: any[] = [];
        
        let hasLocalContestData = false;
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.contests && user.contests.length > 0) {
              const contest = user.contests[0];
              actualContestId = contest.id;
              hasLocalContestData = true;
              if (contest.entryLevelTemplate?.schema?.fields) {
                templateFieldsFromApi = contest.entryLevelTemplate.schema.fields;
              }
            } else if (user?.contestId) {
              actualContestId = user.contestId;
            }
          }
        } catch(e) {}

        if (!hasLocalContestData) {
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
        }

        if (!actualContestId) {
          showSnackbar("Contest not found. Please log in again.", "error");
          setLoading(false);
          return;
        }

        let entryRes;
        if (!hasLocalContestData || templateFieldsFromApi.length === 0) {
          const [contestDetailsRes, res] = await Promise.all([
            contestControllers.getContestDetails(actualContestId),
            entryControllers.getEntryById(actualContestId, entryId)
          ]);
          entryRes = res;
          
          if (contestDetailsRes?.data?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestDetailsRes.data.entryLevelTemplate.schema.fields;
          } else if (contestDetailsRes?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestDetailsRes.entryLevelTemplate.schema.fields;
          }
        } else {
          entryRes = await entryControllers.getEntryById(actualContestId, entryId);
        }

        const fetchedEntry = entryRes?.data || entryRes;
        
        let templateFieldsToUse: any[] = templateFieldsFromApi;
        if (templateFieldsToUse.length === 0) {
          if (fetchedEntry?.contest?.entryLevelTemplate?.schema?.fields) {
            templateFieldsToUse = fetchedEntry.contest.entryLevelTemplate.schema.fields;
          } else if (fetchedEntry?.contest?.entry_level_template?.schema?.fields) {
            templateFieldsToUse = fetchedEntry.contest.entry_level_template.schema.fields;
          }
        }

        setTemplateFields(templateFieldsToUse);
        setEntry(fetchedEntry);
      } catch (error: any) {
        console.error("Failed to fetch entry details:", error);
        showSnackbar(error?.response?.data?.message || "Failed to load entry details.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [entryId, showSnackbar]);

  const getFieldIcon = (type: string, label: string) => {
    const lowercaseLabel = label.toLowerCase();
    if (lowercaseLabel.includes("phone") || lowercaseLabel.includes("mobile") || type === "telInput")
      return <Phone sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("email") || lowercaseLabel.includes("mail"))
      return <Mail sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("date") || lowercaseLabel.includes("dob") || lowercaseLabel.includes("birth") || type === "datePicker")
      return <CalendarToday sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("rating") || type === "rating")
      return <Star sx={{ fontSize: 20 }} />;
    if (lowercaseLabel.includes("score") || lowercaseLabel.includes("points"))
      return <EmojiEvents sx={{ fontSize: 20 }} />;
    if (type === "checkbox" || type === "switch")
      return <CheckCircle sx={{ fontSize: 20 }} />;
    if (type === "slider") return <Tune sx={{ fontSize: 20 }} />;

    if (lowercaseLabel.includes("name") || lowercaseLabel.includes("member") || lowercaseLabel.includes("father"))
      return <AccountCircle sx={{ fontSize: 20 }} />;

    return <Info sx={{ fontSize: 20 }} />;
  };

  const renderFieldValue = (field: any) => {
    const { type, value } = field;

    if (value === undefined || value === null || value === "") {
      return (
        <Typography variant="body2" sx={{ color: "text.disabled", fontStyle: "italic", mt: 0.5 }}>
          Not specified
        </Typography>
      );
    }

    if (type === "rating") {
      return (
        <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
          <Rating value={Number(value)} readOnly precision={0.5} size="small" />
          <Typography variant="caption" sx={{ ml: 1, fontWeight: 600, color: colors.TEXT_SECONDARY }}>
            ({value})
          </Typography>
        </Box>
      );
    }

    if (type === "checkbox" || type === "switch") {
      const isTrue = value === true || String(value).toLowerCase() === "true" || value === "Yes";
      return (
        <Chip
          label={isTrue ? "Yes" : "No"}
          size="small"
          sx={{
            mt: 0.5,
            fontWeight: 600,
            fontSize: "0.75rem",
            bgcolor: isTrue ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
            color: isTrue ? "#10b981" : "#64748b",
            border: `1px solid ${isTrue ? "rgba(16, 185, 129, 0.2)" : "rgba(100, 116, 139, 0.2)"}`,
          }}
        />
      );
    }

    if (type === "datePicker") {
      try {
        return (
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY, mt: 0.5 }}>
            {new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </Typography>
        );
      } catch (e) {
        return <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY, mt: 0.5 }}>{String(value)}</Typography>;
      }
    }

    if (type === "file_upload" || type === "file" || type === "image") {
      if (!value) return null;
      const urlStr = typeof value === 'string' ? value : (value.downloadUrl || String(value));
      const isImage = typeof urlStr === 'string' && urlStr.match(/\.(jpeg|jpg|gif|png|webp)/i);
      
      const handleDownload = async (e: React.MouseEvent) => {
        e.preventDefault();
        try {
          const response = await fetch(urlStr);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const blob = await response.blob();
          const objectUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = objectUrl;
          const urlParts = urlStr.split('?')[0].split('/');
          const filename = urlParts[urlParts.length - 1] || 'download';
          a.download = decodeURIComponent(filename);
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(objectUrl);
        } catch (error) {
          console.error("Download failed, opening in new tab:", error);
          window.open(urlStr, "_blank");
        }
      };

      return (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: `1px solid ${colors.BORDER}`, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.02)' }}>
          {isImage ? (
            <Box sx={{ position: 'relative', width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: `1px solid ${colors.BORDER}` }}>
              <Image src={urlStr} alt="Uploaded file" fill style={{ objectFit: "cover" }} sizes="60px" />
            </Box>
          ) : (
            <Box sx={{ width: 60, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: 1, color: colors.PRIMARY, flexShrink: 0 }}>
              <InsertDriveFile sx={{ fontSize: 30 }} />
            </Box>
          )}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
             <Typography variant="caption" noWrap sx={{ display: 'block', fontWeight: 600, color: colors.TEXT_PRIMARY }}>
               {isImage ? "Image File" : "Document File"}
             </Typography>
             <Button variant="outlined" size="small" onClick={handleDownload} startIcon={<Download />} sx={{ mt: 0.5, textTransform: 'none', py: 0.25, px: 1.5, fontSize: '0.75rem', borderRadius: 1.5 }}>
               Download
             </Button>
          </Box>
        </Box>
      );
    }

    return (
      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY, wordBreak: "break-word", mt: 0.5 }}>
        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
      </Typography>
    );
  };

  const groupedFields = useMemo(() => {
    if (!entry?.submission?.data) return [];

    const submissionData = entry.submission.data;
    const groups: { title: string; fields: { id: string; label: string; value: any; type: string }[] }[] = [];

    let currentGroup = { title: "Information", fields: [] as { id: string; label: string; value: any; type: string }[] };
    const mappedFieldIds = new Set<string>();

    templateFields?.forEach((field: any) => {
      if (field.type === "step_break") {
        if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
          groups.push(currentGroup);
        }
        currentGroup = { title: field.label, fields: [] };
      } else {
        const labelTrimmed = field.label?.trim() || "";
        const downloadUrl = submissionData[`${labelTrimmed}_downloadUrl`] || submissionData[`${field.label}_downloadUrl`] || submissionData[`${field.id}_downloadUrl`];
        const value = downloadUrl || submissionData[labelTrimmed] || submissionData[field.label] || submissionData[field.id];
        currentGroup.fields.push({
          id: field.id,
          label: field.label,
          value: value !== undefined ? value : "",
          type: field.type,
        });
        mappedFieldIds.add(field.id);
      }
    });

    if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
      groups.push(currentGroup);
    }

    const mappedFieldKeys = new Set<string>();
    templateFields?.forEach((f: any) => {
      mappedFieldKeys.add(f.id);
      mappedFieldKeys.add(f.label);
      if (f.label) mappedFieldKeys.add(f.label.trim());
    });



    groups.forEach((group) => {
      const firstNameFieldIdx = group.fields.findIndex(
        (f) => f.label.toLowerCase().replace(/\s/g, "") === "firstname" || f.id.toLowerCase().replace(/\s/g, "") === "firstname"
      );
      const lastNameFieldIdx = group.fields.findIndex(
        (f) => f.label.toLowerCase().replace(/\s/g, "") === "lastname" || f.id.toLowerCase().replace(/\s/g, "") === "lastname"
      );

      if (firstNameFieldIdx !== -1 && lastNameFieldIdx !== -1) {
        const firstName = group.fields[firstNameFieldIdx].value;
        const lastName = group.fields[lastNameFieldIdx].value;

        const fullNameField = {
          id: "fullName_combined",
          label: "Full Name",
          value: `${firstName} ${lastName}`.trim(),
          type: "text",
        };

        group.fields.splice(firstNameFieldIdx, 1, fullNameField);

        const newLastNameFieldIdx = group.fields.findIndex(
          (f) => f.label.toLowerCase().replace(/\s/g, "") === "lastname" || f.id.toLowerCase().replace(/\s/g, "") === "lastname"
        );
        if (newLastNameFieldIdx !== -1) {
          group.fields.splice(newLastNameFieldIdx, 1);
        }
      }
    });

    return groups.filter((g) => g.fields.some((f) => f.value !== "" && f.value !== null && f.value !== undefined));
  }, [entry?.submission?.data, templateFields]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!entry) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Entry not found</Typography>
        <Button variant="contained" onClick={() => router.back()} startIcon={<ArrowBack />}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Breadcrumb
          title="Entry Details"
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Entries", href: "/entries" },
            { title: "Details", href: `/entries/${entryId}` },
          ]}
        />
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/entries')}
          variant="outlined"
          sx={{
            borderRadius: 2,
            borderColor: colors.PRIMARY,
            color: colors.PRIMARY,
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { borderColor: colors.SECONDARY, bgcolor: "rgba(99, 102, 241, 0.04)" },
          }}
        >
          Back to List
        </Button>
      </Box>

      {/* Main Entry Hero Card */}
      <Card
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          border: `1px solid ${colors.BORDER}`,
          background: `linear-gradient(135deg, ${colors.SURFACE} 0%, rgba(99, 102, 241, 0.02) 100%)`,
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.03)",
          mb: 5,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        <Grid container spacing={4} sx={{ alignItems: "center" }}>
          <Grid size={{ xs: 12, sm: 4, md: 3, lg: 2 }} sx={{ display: "flex", justifyContent: "center" }}>
            <Avatar
              variant="rounded"
              src={(() => {
                const submissionData = entry?.submission?.data || {};
                const thumbnailField = templateFields?.find((f: any) => f.label?.toLowerCase().includes("thumbnail"));
                let thumbnailUrl = "";
                if (thumbnailField) {
                  thumbnailUrl = submissionData[`${thumbnailField.id}_downloadUrl`] || submissionData[`${thumbnailField.label}_downloadUrl`] || submissionData[thumbnailField.id] || submissionData[thumbnailField.label] || "";
                }
                if (!thumbnailUrl) {
                  const downloadUrlKey = Object.keys(submissionData).find((key) => key.endsWith("_downloadUrl"));
                  thumbnailUrl = downloadUrlKey ? submissionData[downloadUrlKey] : "";
                }
                if (!thumbnailUrl) {
                  const imageUrlKey = Object.keys(submissionData).find((key) => {
                    if (key === "status" || key.endsWith("_downloadUrl")) return false;
                    const val = submissionData[key];
                    return typeof val === "string" && /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(val);
                  });
                  if (imageUrlKey) thumbnailUrl = submissionData[imageUrlKey];
                }
                return thumbnailUrl;
              })()}
              sx={{
                width: 120,
                height: 120,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${colors.PRIMARY} 0%, ${colors.SECONDARY} 100%)`,
                boxShadow: "0 8px 24px rgba(99, 102, 241, 0.2)",
              }}
            >
              <EmojiEvents sx={{ fontSize: 60, color: "#fff" }} />
            </Avatar>
          </Grid>

          <Grid size={{ xs: 12, sm: 8, md: 9, lg: 10 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 3, mb: 2 }}>
              <Typography variant="h4" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY, fontSize: { xs: "1.75rem", md: "2.25rem" } }}>
                {(() => {
                  let entryTitle = "Untitled Entry";
                  const entryData = entry?.submission?.data;
                  if (entryData) {
                    const titleField = templateFields.find((f: any) => f.label?.toLowerCase().includes("title") || f.label?.toLowerCase().includes("project"));
                    if (titleField && entryData[titleField.id]) entryTitle = entryData[titleField.id];
                    else {
                      const firstText = templateFields.find((f: any) => f.type === 'textfield');
                      if (firstText && entryData[firstText.id]) entryTitle = entryData[firstText.id];
                    }
                  }
                  return entryTitle;
                })()}
              </Typography>
              {(() => {
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

                const mappedLabel = getMappedStatus(entry.status);

                return (
                  <Chip 
                    label={mappedLabel}
                    sx={{ 
                      bgcolor: entry.status?.toLowerCase() === "approved" ? "#E6F4EA" : entry.status?.toLowerCase() === "evaluated" || entry.status?.toLowerCase() === "evaluate" ? "#e0e7ff" : entry.status?.toLowerCase() === "rejected" || entry.status?.toLowerCase() === "reject" ? "#FCE8E6" : "#FEF7E0",
                      color: entry.status?.toLowerCase() === "approved" ? "#137333" : entry.status?.toLowerCase() === "evaluated" || entry.status?.toLowerCase() === "evaluate" ? "#3730a3" : entry.status?.toLowerCase() === "rejected" || entry.status?.toLowerCase() === "reject" ? "#C5221F" : "#B06000",
                      fontWeight: 600,
                      textTransform: 'capitalize',
                      border: "none",
                    }}
                  />
                );
              })()}
              
              {(entry.score !== undefined && entry.score !== null) && (
                <Chip
                  icon={<EmojiEvents sx={{ fontSize: "16px !important", color: "#fff !important" }} />}
                  label={`Score: ${entry.score}`}
                  sx={{
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    color: "#fff",
                    fontWeight: 700,
                    boxShadow: "0 4px 12px rgba(245, 158, 11, 0.2)",
                    border: "none",
                    "& .MuiChip-label": { px: 1.5 },
                  }}
                />
              )}
            </Box>

            <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY, mb: 3, fontWeight: 500 }}>
              Submitted by:{" "}
              <Box component="span" sx={{ color: colors.TEXT_PRIMARY, fontWeight: 700 }}>
                {(() => {
                  let participantName = "Unknown Participant";
                  const userData = entry?.participant?.submission?.data;
                  const userFields = entry?.contest?.userLevelTemplate?.schema?.fields || entry?.contest?.user_level_template?.schema?.fields || [];
                  const entryData = entry?.submission?.data;
                  const entryFields = entry?.contest?.entryLevelTemplate?.schema?.fields || entry?.contest?.entry_level_template?.schema?.fields || [];
                  
                  if (userData) {
                    const nameField = userFields.find((f: any) => f.label?.toLowerCase().includes("name") || f.label?.toLowerCase().includes("first name"));
                    if (nameField && userData[nameField.id]) {
                      participantName = userData[nameField.id];
                    } else {
                      const firstText = userFields.find((f: any) => f.type === 'textfield');
                      if (firstText && userData[firstText.id]) participantName = userData[firstText.id];
                    }
                  }
                  if (participantName === "Unknown Participant" && entryData) {
                    const nameField = entryFields.find((f: any) => f.label?.toLowerCase().includes("name") || f.label?.toLowerCase().includes("first"));
                    if (nameField && entryData[nameField.id]) {
                      participantName = entryData[nameField.id];
                      const lastNameField = entryFields.find((f: any) => f.label?.toLowerCase() === "lastname" || f.label?.toLowerCase().includes("last name"));
                      if (lastNameField && entryData[lastNameField.id]) {
                        participantName += " " + entryData[lastNameField.id];
                      }
                    }
                  }
                  return participantName;
                })()}
              </Box>
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, display: "block", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5, mb: 0.5 }}>
                  Submitted At
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
                  {new Date(entry.createdAt || entry.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {entry.status?.toLowerCase() === "rejected" && entry.rejectReason && (
          <Box sx={{ mt: 4, p: 2, borderRadius: 2, bgcolor: "rgba(220, 38, 38, 0.05)", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
            <Typography variant="subtitle2" sx={{ color: "#dc2626", fontWeight: 700, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Info fontSize="small" /> Reason for Rejection
            </Typography>
            <Typography variant="body2" sx={{ color: colors.TEXT_PRIMARY, pl: 3 }}>{entry.rejectReason}</Typography>
          </Box>
        )}
      </Card>

      {/* Submission Details grouped by Step Breaks */}
      {groupedFields.map((group, gIdx) => (
        <Box key={gIdx} sx={{ mb: 5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, mt: gIdx !== 0 ? 2 : 0 }}>
            <Box sx={{ width: 4, height: 24, borderRadius: 1, bgcolor: colors.PRIMARY, mt: 3 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY, mt: 3 }}>
              {group.title}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", bgcolor: colors.SURFACE, borderRadius: 3, border: `1px solid ${colors.BORDER}`, p: 1 }}>
            {group.fields.map((field: any, idx: number) => (
              <Box
                key={field.id}
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  py: 2.5,
                  borderBottom: idx === group.fields.length - 1 ? 'none' : `1px dashed ${colors.BORDER}`,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                  px: { xs: 2, sm: 3 },
                  borderRadius: 2,
                  gap: { xs: 1, sm: 0 },
                  transition: "background-color 0.2s ease"
                }}
              >
                <Box sx={{ width: { xs: "100%", sm: "35%", md: "30%" }, display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", p: 1, borderRadius: 2, bgcolor: "rgba(99, 102, 241, 0.05)", color: colors.PRIMARY }}>
                    {getFieldIcon(field.type, field.label)}
                  </Box>
                  <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY, fontWeight: 600, letterSpacing: 0.5 }}>
                    {field.label}
                  </Typography>
                </Box>
                <Box sx={{ width: { xs: "100%", sm: "65%", md: "70%" }, pl: { xs: 0, sm: 2 }, pt: { xs: 1, sm: 0 } }}>
                  {renderFieldValue(field)}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default EntryDetails;
