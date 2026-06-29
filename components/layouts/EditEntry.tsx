"use client";
import React, { useEffect, useState } from "react";
import { Box, Card, Typography, CircularProgress } from "@mui/material";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import DynamicFormRenderer from "@/components/widgets/DynamicFormRenderer";
import { contestControllers } from "@/api/contestControllers";
import { entryControllers } from "@/api/entryControllers";
import { useSnackbar } from "@/context/SnackbarContext";

import { AuthControllers } from "@/api/authControllers";

const extractS3Key = (url: string) => {
  if (!url || typeof url !== 'string') return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return url;
  
  try {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    
    const entriesIdx = path.indexOf('/entries/');
    if (entriesIdx !== -1) {
      return path.slice(entriesIdx + 1);
    }
    const usersIdx = path.indexOf('/users/');
    if (usersIdx !== -1) {
      return path.slice(usersIdx + 1);
    }
    
    let cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const segments = cleanPath.split('/');
    if (segments.length > 1 && (segments[0].includes('bucket') || segments[0].includes('launchpad'))) {
      cleanPath = segments.slice(1).join('/');
    }
    return cleanPath;
  } catch (e) {
    return url;
  }
};

const EditEntry = ({ entryId }: { entryId: string }) => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [contestId, setContestId] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
  const [initialData, setInitialData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        let templateFieldsFromApi = null;
        let fetchedContestId = null;

        let hasLocalContestData = false;
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.contests && user.contests.length > 0) {
              const contest = user.contests[0];
              fetchedContestId = contest.id;
              hasLocalContestData = true;
              if (contest.entryLevelTemplate?.schema?.fields) {
                templateFieldsFromApi = contest.entryLevelTemplate.schema.fields;
              }
            } else if (user?.contestId) {
              fetchedContestId = user.contestId;
            }
          }
        } catch(e) {}

        if (!hasLocalContestData || !templateFieldsFromApi) {
          // We will call getContest() which for participants returns their specific contest details directly.
          const contestRes = await contestControllers.getContest();
          
          // If the backend returns the contest object directly (Contest overview fetched)
          if (contestRes?.data?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestRes.data.entryLevelTemplate.schema.fields;
            fetchedContestId = contestRes.data.id;
          } 
          // If the backend returns an array of docs (Contests fetched successfully)
          else if (contestRes?.data?.docs && contestRes.data.docs.length > 0) {
            fetchedContestId = contestRes.data.docs[0].id;
            
            if (contestRes.data.docs[0].entryLevelTemplate?.schema?.fields) {
               templateFieldsFromApi = contestRes.data.docs[0].entryLevelTemplate.schema.fields;
            } else {
               // Fallback if template is not in the list response
               const detailsRes = await contestControllers.getContestDetails(fetchedContestId);
               templateFieldsFromApi = detailsRes?.data?.entryLevelTemplate?.schema?.fields || detailsRes?.entryLevelTemplate?.schema?.fields;
            }
          }
          else if (contestRes?.entryLevelTemplate?.schema?.fields) {
            templateFieldsFromApi = contestRes.entryLevelTemplate.schema.fields;
            fetchedContestId = contestRes.id;
          }
        }

        if (fetchedContestId) {
          setContestId(fetchedContestId);
          if (entryId) {
            try {
              const entryRes = await entryControllers.getEntryById(fetchedContestId, entryId);
              const actualEntry = entryRes?.data || entryRes;

              // Check if contest is active/published
              const contestStatus = actualEntry?.contest?.status;
              if (contestStatus && contestStatus.toLowerCase() !== "published") {
                showSnackbar("This contest is no longer active or published. You cannot edit this entry.", "warning");
                router.push("/entries");
                return;
              }

              // Check if user is banned globally or specifically from this contest
              let userObj: any = null;
              try {
                const meRes = await AuthControllers.getParticipants();
                if (meRes?.data) {
                  userObj = meRes.data;
                  localStorage.setItem("user", JSON.stringify(userObj));
                }
              } catch (e) {
                console.error("Failed to fetch /me", e);
              }

              if (!userObj) {
                try {
                  const userStr = localStorage.getItem("user");
                  if (userStr) userObj = JSON.parse(userStr);
                } catch (e) {}
              }

              if (userObj) {
                if (userObj.status?.toLowerCase() === "banned") {
                  showSnackbar("You have been banned. You cannot edit entries.", "error");
                  router.push("/entries");
                  return;
                }
                const participantObj = userObj.participants?.find(
                  (p: any) => p.contest_id === fetchedContestId || p.contest?.id === fetchedContestId || p.contest?._id === fetchedContestId
                );
                if (participantObj && participantObj.status?.toLowerCase() === "banned") {
                  showSnackbar("You have been banned from this contest. You cannot edit this entry.", "error");
                  router.push("/entries");
                  return;
                }
              }

              if (actualEntry?.submission?.data) {
                 let sData = actualEntry.submission.data;
                 if (typeof sData === 'string') {
                    try { sData = JSON.parse(sData); } catch(e) {}
                 }
                 setInitialData(sData?.data || sData || {});
              }
            } catch (e) {
              console.error("Failed to load draft entry data:", e);
              showSnackbar("Failed to load draft entry.", "error");
            }
          }
        }

        if (templateFieldsFromApi) {
          setTemplateFields(templateFieldsFromApi);
        } else {
          showSnackbar("No entry form template found for this contest.", "error");
        }
      } catch (error) {
        console.error("Failed to fetch contest template:", error);
        showSnackbar("Failed to load submission form.", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchTemplate();
  }, [showSnackbar, router]);

  const submitForm = async (values: any, status: string) => {
    try {
      if (!contestId) return;

      const formData = new FormData();
      Object.keys(values).forEach(key => {
        const value = values[key];
        const fieldDef = templateFields.find(f => f.id === key);
        
        if (value !== undefined && value !== null) {
          if (fieldDef?.type === "file_upload" || fieldDef?.type === "file" || fieldDef?.type === "image") {
            if (value instanceof File) {
              formData.append(key, value);
            } else if (typeof value === "string") {
              const originalValue = initialData[key] || (fieldDef?.label ? initialData[fieldDef.label] : null) || (fieldDef?.label ? initialData[fieldDef.label.trim()] : null) || value;
              formData.append(key, originalValue);
            } else if (value === null) {
              formData.append(key, "");
            }
          } else {
            if (value !== "") {
              formData.append(key, value);
            } else {
              formData.append(key, "");
            }
          }
        }
      });
      formData.append("status", status);
      if (status === "draft") {
        formData.append("isDraft", "true");
      }

      await entryControllers.updateEntrySubmission(contestId, entryId, formData);
      showSnackbar(`Draft ${status === 'draft' ? 'saved' : 'submitted'} successfully!`, "success");
      router.push("/entries");
    } catch (err: any) {
      console.log(err);
      showSnackbar(
        err?.response?.data?.message || `Failed to ${status === 'draft' ? 'save draft' : 'submit entry'}`,
        "error"
      );
    }
  };

  const handleSubmit = async (values: any) => {
    await submitForm(values, "pending");
  };

  const handleDraft = async (values: any) => {
    await submitForm(values, "draft");
  };

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title="Edit Draft Entry"
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Entries", href: "/entries" },
            { title: "Edit Draft", href: `/entries/edit/${entryId}` },
          ]}
        />
        <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
          Update your drafted innovation entry before submitting.
        </Typography>
      </Box>

      <Card elevation={0} sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, border: `1px solid ${colors.BORDER}` }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={40} sx={{ color: colors.PRIMARY }} />
          </Box>
        ) : templateFields.length > 0 ? (
          <DynamicFormRenderer
            fields={templateFields}
            initialData={initialData}
            onSubmit={handleSubmit}
            onDraft={handleDraft}
            submitLabel="Submit Entry"
          />
        ) : (
          <Typography align="center" color="text.secondary">
            Form is currently unavailable.
          </Typography>
        )}
      </Card>
    </Box>
  );
};

export default EditEntry;
