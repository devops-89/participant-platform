"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Box, Typography, Card, CircularProgress, Alert } from "@mui/material";

import { contestControllers } from "@/api/contestControllers";
import DynamicFormRenderer from "@/components/widgets/DynamicFormRenderer";
import { montserrat } from "@/utils/fonts";

const ContestRegistrationPage = () => {
  const params = useParams();
  const router = useRouter();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) as string;

  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { data, isPending, error } = useQuery({
    queryKey: ["Contest Details", id],
    queryFn: () => contestControllers.getContestDetails(id),
    enabled: !!id,
  });

  const template_fields = data?.data?.userLevelTemplate?.schema?.fields;

  const handleRegistrationSubmit = async (values: any) => {
    try {
      // Assuming a generic API for now. Will need to adjust to actual registration endpoint
      // await authControllers.registerForContest({ data: values }, id);
      console.log("Registration Payload:", values);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setRegistrationSuccess(true);
      
      // Redirect to dashboard or login
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      
    } catch (err) {
      console.error("Registration failed", err);
      // Handle error (show snackbar or alert)
    }
  };

  if (isPending) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", p: 4 }}>
        <Alert severity="error">Failed to load registration form. Please check the contest link.</Alert>
      </Box>
    );
  }

  if (!template_fields || template_fields.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", p: 4 }}>
        <Alert severity="warning">This contest does not have a registration form configured.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: 8, px: 2, backgroundColor: "#f8fafc" }}>
      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Card sx={{ p: { xs: 3, md: 5 }, borderRadius: 4, boxShadow: "0px 10px 30px rgba(0,0,0,0.05)" }}>
          <Typography
            variant="h4"
            sx={{
              mb: 1,
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 700,
              color: "#0f172a",
              textAlign: "center"
            }}
          >
            Register for {data?.data?.name || "Contest"}
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mb: 4, textAlign: "center" }}>
            Please fill out the form below to complete your registration.
          </Typography>

          {registrationSuccess ? (
            <Alert severity="success" sx={{ mb: 4 }}>
              Registration successful! Redirecting you to the dashboard...
            </Alert>
          ) : (
            <DynamicFormRenderer
              fields={template_fields}
              onSubmit={handleRegistrationSubmit}
              submitLabel="Complete Registration"
            />
          )}
        </Card>
      </Box>
    </Box>
  );
};

export default ContestRegistrationPage;
