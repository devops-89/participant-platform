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
  Image as ImageIcon,
  Info,
  InsertDriveFile,
  Mail,
  Phone,
  Star,
  Tune,
  Videocam
} from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Rating, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

import EntryDetailsSection from "@/components/layouts/entry-details/EntryDetailsSection";
import EntryHeroSection from "@/components/layouts/entry-details/EntryHeroSection";
import InnovationVideoPlayer, { VideoPlayerRenderer } from "@/components/layouts/entry-details/InnovationVideoPlayer";
import TeamMembersSection from "@/components/layouts/entry-details/TeamMembersSection";

interface TemplateField { id: string; label?: string; type?: string; [key: string]: unknown; }
interface Contest { id?: string; _id?: string; name?: string; title?: string; status?: string; entryLevelTemplate?: { schema?: { fields?: TemplateField[] } }; entry_level_template?: { schema?: { fields?: TemplateField[] } }; [key: string]: unknown; }
interface Entry { id?: string; submission_id?: string; status?: string; score?: number; contest_id?: string; contest?: Contest; participant?: { status?: string; submission?: { data?: Record<string, string> }; [key: string]: unknown; }; submission?: { id?: string; data?: Record<string, string> }; [key: string]: unknown; }

const EntryDetails = ({ entryId }: { entryId: string }) => {
  const { colors } = useAppTheme();
  const { showSnackbar } = useSnackbar();
  const router = useRouter();
  
  const [entry, setEntry] = useState<Entry | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        let actualContestId = null;
        let templateFieldsFromApi: TemplateField[] = [];
        let hasLocalContestData = false;
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.participants && Array.isArray(user.participants)) {
              for (const p of user.participants) {
                if (p.entries && Array.isArray(p.entries)) {
                  const foundEntry = p.entries.find((e: Entry) => e.id === entryId || e.submission?.id === entryId || e.submission_id === entryId);
                  if (foundEntry) {
                    actualContestId = p.contest_id || p.contest?.id;
                    hasLocalContestData = true;
                    if (p.contest?.entryLevelTemplate?.schema?.fields) {
                      templateFieldsFromApi = p.contest.entryLevelTemplate.schema.fields;
                    } else if (p.contest?.entry_level_template?.schema?.fields) {
                      templateFieldsFromApi = p.contest.entry_level_template.schema.fields;
                    }
                    break;
                  }
                }
              }
            }

            // Fallback for single contest logic
            if (!actualContestId && user?.contests && user.contests.length > 0) {
              const contest = user.contests[0];
              actualContestId = contest.id;
              hasLocalContestData = true;
              if (contest.entryLevelTemplate?.schema?.fields) {
                templateFieldsFromApi = contest.entryLevelTemplate.schema.fields;
              }
            } else if (!actualContestId && user?.contestId) {
              actualContestId = user.contestId;
            }
          }
        } catch {}

        if (!hasLocalContestData && !actualContestId) {
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

        const fetchedEntry = (entryRes?.data || entryRes) as Entry;
        
        let templateFieldsToUse: TemplateField[] = templateFieldsFromApi;
        if (fetchedEntry) {
          if (fetchedEntry?.contest?.entryLevelTemplate?.schema?.fields) {
            templateFieldsToUse = fetchedEntry.contest.entryLevelTemplate.schema.fields;
          } else if (fetchedEntry?.contest?.entry_level_template?.schema?.fields) {
            templateFieldsToUse = fetchedEntry.contest.entry_level_template.schema.fields;
          }
        }

        setTemplateFields(templateFieldsToUse);
        setEntry(fetchedEntry);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        console.error("Failed to fetch entry:", err);
        showSnackbar(err?.response?.data?.message || "Failed to load entry.", "error");
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
    if (type === "file_upload" || lowercaseLabel.includes("video")) {
      if (lowercaseLabel.includes("video")) return <Videocam sx={{ fontSize: 20 }} />;
      if (lowercaseLabel.includes("image") || lowercaseLabel.includes("photo")) return <ImageIcon sx={{ fontSize: 20 }} />;
      return <InsertDriveFile sx={{ fontSize: 20 }} />;
    }

    if (lowercaseLabel.includes("name") || lowercaseLabel.includes("member") || lowercaseLabel.includes("father"))
      return <AccountCircle sx={{ fontSize: 20 }} />;

    return <Info sx={{ fontSize: 20 }} />;
  };

  const renderFieldValue = (field: { type?: string; value?: unknown }) => {
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
            ({String(value)})
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
            {new Date(value as string | number).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </Typography>
        );
      } catch {
        return <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY, mt: 0.5 }}>{String(value)}</Typography>;
      }
    }

    if (type === "file_upload" || type === "file" || type === "image") {
      if (!value) return null;
      const urlStr = typeof value === 'string' ? value : ((value as { downloadUrl?: string }).downloadUrl || String(value));
      const urlWithoutQuery = urlStr.split('?')[0];
      const extension = urlWithoutQuery.split('.').pop()?.toLowerCase();
      const isImage = typeof urlStr === 'string' && urlStr.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i);
      const isVideo = ['mp4', 'mov', 'mkv', 'webm', 'ogg'].includes(extension || "");
      
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
        <Box sx={{ mt: 1, display: 'flex', flexDirection: isVideo ? 'column' : { xs: 'column', sm: 'row' }, alignItems: isVideo ? 'stretch' : 'center', gap: 2, p: 2, border: `1px solid ${colors.BORDER}`, borderRadius: 3, bgcolor: "rgba(0,0,0,0.02)", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          {isVideo ? (
            <VideoPlayerRenderer urlStr={urlStr} />
          ) : isImage ? (
            <Box sx={{ position: 'relative', width: 80, height: 80, borderRadius: 2, overflow: 'hidden', flexShrink: 0, border: `1px solid ${colors.BORDER}`, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
              <Image src={urlStr} alt="Uploaded file" fill style={{ objectFit: "cover" }} sizes="80px" />
            </Box>
          ) : (
            <Box sx={{ width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2, color: colors.PRIMARY, flexShrink: 0 }}>
              <InsertDriveFile sx={{ fontSize: 36 }} />
            </Box>
          )}
          {!isVideo && (
            <Box sx={{ flexGrow: 1, minWidth: 0, pl: 1 }}>
               <Typography variant="body1" noWrap sx={{ display: 'block', fontWeight: 700, color: colors.TEXT_PRIMARY }}>
                 {isImage ? "Image File" : "Document File"}
               </Typography>
               {!isImage && (
                 <Button variant="outlined" size="small" onClick={handleDownload} startIcon={<Download />} sx={{ mt: 1, textTransform: 'none', py: 0.5, px: 2, fontSize: '0.85rem', borderRadius: 2, fontWeight: 600 }}>
                   Download File
                 </Button>
               )}
            </Box>
          )}
          {isVideo && (
            <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", width: "100%", maxWidth: 600, gap: 2, px: 1 }}>
               <Typography variant="h6" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY }}>
                 Video Attachment
               </Typography>
            </Box>
          )}
        </Box>
      );
    }

    const renderValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    // Check if the value is a valid URL
    const isUrl = typeof renderValue === 'string' && (renderValue.startsWith('http://') || renderValue.startsWith('https://'));

    if (isUrl) {
      return (
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word", mt: 0.5 }}>
          <a href={renderValue} target="_blank" rel="noopener noreferrer" style={{ color: colors.PRIMARY, textDecoration: 'underline' }}>
            {renderValue}
          </a>
        </Typography>
      );
    }

    return (
      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY, wordBreak: "break-word", mt: 0.5 }}>
        {renderValue}
      </Typography>
    );
  };

  const groupedFields = useMemo(() => {
    if (!entry?.submission?.data) return [];

    const submissionData = entry.submission.data;
    const groups: { title: string; fields: { id: string; label: string; value: string | number | boolean | null | undefined; type: string }[] }[] = [];

    let currentGroup = { title: "Information", fields: [] as { id: string; label: string; value: string | number | boolean | null | undefined; type: string }[] };
    const mappedFieldIds = new Set<string>();

    templateFields?.forEach((field) => {
      if (field.type === "step_break") {
        if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
          groups.push(currentGroup);
        }
        currentGroup = { title: field.label || "", fields: [] };
      } else {
        if (field.type === "textblock" || field.type === "checkbox") return;
        const labelTrimmed = field.label?.trim() || "";
        const downloadUrl = submissionData[`${labelTrimmed}_downloadUrl`] || submissionData[`${field.label || ""}_downloadUrl`] || submissionData[`${field.id || ""}_downloadUrl`];
        const value = downloadUrl || submissionData[labelTrimmed] || submissionData[field.label || ""] || submissionData[field.id || ""];
        currentGroup.fields.push({
          id: field.id || "",
          label: field.label || "",
          value: value as string | number | boolean | null | undefined,
          type: field.type || "",
        });
        mappedFieldIds.add(field.id);
      }
    });

    if (currentGroup.fields.length > 0 || currentGroup.title !== "Information") {
      groups.push(currentGroup);
    }

    const mappedFieldKeys = new Set<string>();
    templateFields?.forEach((f) => {
      if (f.id) mappedFieldKeys.add(f.id);
      if (f.label) {
        mappedFieldKeys.add(f.label);
        mappedFieldKeys.add(f.label.trim());
      }
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

      {entry && (
        <>
          <EntryHeroSection entry={entry} colors={colors} showStatus />

          {(() => {
            let youtubeUrl = "";
            for (const group of groupedFields) {
              for (const field of group.fields) {
                if (field.label?.toLowerCase().includes("youtube") || field.label?.toLowerCase().includes("video link")) {
                  if (field.value && typeof field.value === 'string' && field.value.includes('http')) {
                    youtubeUrl = field.value;
                  }
                }
              }
            }

            let videoId = null;
            if (youtubeUrl) {
              const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
              const match = youtubeUrl.match(regExp);
              videoId = (match && match[2].length === 11) ? match[2] : null;
            }

            const otherGroups = groupedFields.filter((g) => g.title !== "Information" && !g.title?.toLowerCase().includes("member"));
            const memberGroups = groupedFields.filter((g) => g.title?.toLowerCase().includes("member"));
            const participantEmail = Object.values(entry?.participant?.submission?.data || {}).find(v => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) as string | undefined;

            return (
              <>
                <InnovationVideoPlayer videoId={videoId} colors={colors} />
                <TeamMembersSection memberGroups={memberGroups} colors={colors} participantEmail={participantEmail} renderFieldValue={renderFieldValue} />
                <EntryDetailsSection otherGroups={otherGroups} colors={colors} videoId={videoId} memberGroupsLength={memberGroups.length} getFieldIcon={getFieldIcon} renderFieldValue={renderFieldValue} />
              </>
            );
          })()}
        </>
      )}
    </Box>
  );
};

export default EntryDetails;