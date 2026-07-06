"use client";
import React, { useEffect, useState } from "react";
import { ContestTemplateField } from "@/types/user";
import { Box, Card, Typography, CircularProgress } from "@mui/material";
import { useAppTheme } from "@/context/ThemeContext";
import { useRouter, useSearchParams } from "next/navigation";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import DynamicFormRenderer from "@/components/widgets/DynamicFormRenderer";
import { contestControllers } from "@/api/contestControllers";
import { entryControllers } from "@/api/entryControllers";
import { useSnackbar } from "@/context/SnackbarContext";

import { AuthControllers } from "@/api/authControllers";

const AddEntry = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();

  const urlContestId = searchParams.get("contestId");

  const [contestId, setContestId] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<ContestTemplateField[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        let templateFieldsFromApi = null;
        let fetchedContestId = null;

        let hasLocalContestData = false;

        if (urlContestId) {
          try {
            const detailsRes = await contestControllers.getContestDetails(urlContestId);
            const fields = detailsRes?.data?.entryLevelTemplate?.schema?.fields || detailsRes?.entryLevelTemplate?.schema?.fields;
            if (fields) {
              templateFieldsFromApi = fields;
              fetchedContestId = urlContestId;
              hasLocalContestData = true;
            }
          } catch (err: unknown) {
            console.error("Failed to fetch contest by ID from URL", err);
          }
        }

        if (!hasLocalContestData) {
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
          } catch {}
        }

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

          // Check if this participant already has an entry for this contest
          let userObj: unknown = null;
          try {
            const meRes = await AuthControllers.getParticipants();
            if (meRes?.data) {
              userObj = meRes.data;
              localStorage.setItem("user", JSON.stringify(userObj));
            }
          } catch {
            console.error("Failed to fetch /me");
          }

          if (!userObj) {
            try {
              const userStr = localStorage.getItem("user");
              if (userStr) userObj = JSON.parse(userStr);
            } catch {}
          }

          if (userObj) {
            if ((userObj as { status?: string; participants?: Array<{ contest_id?: string; contest?: { id?: string; _id?: string; status?: string; }; status?: string; entries?: unknown[]; }> }).status?.toLowerCase() === "banned") {
              showSnackbar("You have been banned. You cannot submit entries.", "error");
              router.push("/entries");
              return;
            }
            if ((userObj as { status?: string; participants?: Array<{ contest_id?: string; contest?: { id?: string; _id?: string; status?: string; }; status?: string; entries?: unknown[]; }> }).participants) {
              const participantObj = (userObj as { status?: string; participants?: Array<{ contest_id?: string; contest?: { id?: string; _id?: string; status?: string; }; status?: string; entries?: unknown[]; }> }).participants?.find(
                (p: { contest_id?: string; contest?: { id?: string; _id?: string; status?: string; }; status?: string; entries?: unknown[]; }) => p.contest_id === fetchedContestId || (p.contest && (p.contest.id === fetchedContestId || p.contest._id === fetchedContestId))
              );
              if (participantObj) {
                const contestStatus = participantObj.contest?.status;
                if (contestStatus && contestStatus.toLowerCase() !== "published") {
                  showSnackbar("This contest is not active or published. You cannot submit entries for it.", "warning");
                  router.push("/entries");
                  return;
                }
                if (participantObj.status?.toLowerCase() === "banned") {
                  showSnackbar("You have been banned from this contest. You cannot submit entries for it.", "error");
                  router.push("/entries");
                  return;
                }
                if (participantObj.entries && participantObj.entries.length > 0) {
                  showSnackbar("You have already submitted an entry for this contest.", "warning");
                  router.push("/entries");
                  return;
                }
              }
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
  }, [showSnackbar, router, urlContestId]);

  const submitForm = async (values: Record<string, unknown>, status: string) => {
    try {
      if (!contestId) return;

      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== "") {
          formData.append(key, values[key] as string | Blob);
        }
      });
      formData.append("status", status);
      if (status === "draft") {
        formData.append("isDraft", "true");
      }

      await entryControllers.createEntry(contestId, formData);
      showSnackbar(`Entry ${status === 'draft' ? 'saved as draft' : 'added'} successfully!`, "success");
      router.push("/entries");
    } catch (err: unknown) {
      console.log(err);
      showSnackbar(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message || `Failed to ${status === 'draft' ? 'save draft' : 'add entry'}`,
        "error"
      );
    }
  };

  const handleSubmit = async (values: Record<string, unknown>) => {
    await submitForm(values, "pending");
  };

  const handleDraft = async (values: Record<string, unknown>) => {
    await submitForm(values, "draft");
  };

  return (
    <Box sx={{ py: { xs: 2, md: 4 }, minHeight: "100vh", backgroundColor: "#f8fafc" }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title="Submit New Entry"
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Entries", href: "/entries" },
            { title: "Add Entry", href: "/entries/add" },
          ]}
        />
        <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
          Fill out the form below to submit your innovation for the contest.
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

export default AddEntry;
