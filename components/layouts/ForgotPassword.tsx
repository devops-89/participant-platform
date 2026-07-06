"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { useForgotPassword } from "@/hooks/auth/useForgotPassword";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { ForgotPassword_Validation } from "@/utils/validation";
import {
  Box,
  Button,
  Container,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { AxiosError } from "axios";
import { useFormik } from "formik";
import React from "react";

import { useSnackbar } from "@/context/SnackbarContext";

interface ErrorResponse {
  message: string;
}

const ForgotPassword = () => {
  const { colors } = useAppTheme();
  const { showSnackbar } = useSnackbar();
  const { forgotPassword, isLoading, error: apiError } = useForgotPassword();

  const { isChecking } = useGuestGuard();

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: ForgotPassword_Validation,
    onSubmit: async (values) => {
      try {
        await forgotPassword(values);
      } catch (err) {
        const error = err as AxiosError<ErrorResponse>;
        showSnackbar(
          error.response?.data?.message ??
            error.message ??
            "An error occurred",
          "error"
        );
      }
    },
  });

  React.useEffect(() => {
    if (apiError) {
      showSnackbar(apiError, "error");
    }
  }, [apiError, showSnackbar]);

  const textFieldStyles = {
    "& .MuiOutlinedInput-root": {
      color: colors.TEXT_PRIMARY,
      "& fieldset": { borderColor: colors.BORDER },
      "&:hover fieldset": { borderColor: colors.PRIMARY },
      "&.Mui-focused fieldset": { borderColor: colors.PRIMARY },
    },
    "& .MuiInputLabel-root": { color: colors.TEXT_SECONDARY },
    "& .MuiInputLabel-root.Mui-focused": { color: colors.PRIMARY },
  };

  if (isChecking) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
        padding: 2,
        transition: "background 0.3s ease",
      }}
    >
      <Container maxWidth="sm">
        <form onSubmit={formik.handleSubmit}>
          <Paper
            elevation={0}
            sx={{
              padding: { xs: 4, md: 6 },
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.8)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${colors.BORDER}`,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  color: colors.TEXT_PRIMARY,
                  letterSpacing: "-0.025em",
                }}
              >
                Forgot Password
              </Typography>

              <Typography
                variant="body1"
                sx={{ color: colors.TEXT_SECONDARY }}
              >
                Enter your email address to receive an OTP.
              </Typography>
            </Box>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                variant="outlined"
                sx={textFieldStyles}
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.email &&
                  Boolean(formik.errors.email)
                }
                helperText={
                  formik.touched.email && formik.errors.email
                }
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  py: 1.5,
                  bgcolor: colors.PRIMARY,
                  color: "white",
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "none",
                  borderRadius: 2,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: colors.PRIMARY,
                    opacity: 0.9,
                    transform: "translateY(-1px)",
                    boxShadow: `0 10px 15px -3px ${colors.PRIMARY}40`,
                  },
                  "&.Mui-disabled": {
                    bgcolor: colors.PRIMARY,
                    opacity: 0.7,
                    color: "white",
                  },
                }}
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Link
                  href="/"
                  variant="body2"
                  sx={{
                    color: colors.PRIMARY,
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Back to Login
                </Link>
              </Box>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

export default ForgotPassword;