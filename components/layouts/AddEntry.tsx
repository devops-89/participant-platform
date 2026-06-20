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

const AddEntry = () => {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [contestId, setContestId] = useState<string | null>(null);
  const [templateFields, setTemplateFields] = useState<any[]>([]);
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
  }, [showSnackbar]);

  const submitForm = async (values: any, status: string) => {
    try {
      if (!contestId) return;

      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null && values[key] !== "") {
          formData.append(key, values[key]);
        }
      });
      formData.append("status", status);
      if (status === "draft") {
        formData.append("isDraft", "true");
      }

      await entryControllers.createEntry(contestId, formData);
      showSnackbar(`Entry ${status === 'draft' ? 'saved as draft' : 'added'} successfully!`, "success");
      router.push("/entries");
    } catch (err: any) {
      console.log(err);
      showSnackbar(
        err?.response?.data?.message || `Failed to ${status === 'draft' ? 'save draft' : 'add entry'}`,
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
