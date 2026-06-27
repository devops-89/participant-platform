"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { useResetPassword } from "@/hooks/auth/useResetPassword";
import { ResetPassword_Validation } from "@/utils/validation";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

import { useSnackbar } from "@/context/SnackbarContext";

const ResetPasswordForm = () => {
  const { colors } = useAppTheme();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const otp = searchParams.get("otp") || "";
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  

  const { showSnackbar } = useSnackbar();
  const { resetPassword, isLoading, error: apiError } = useResetPassword();

  const { isChecking } = useGuestGuard();

  const formik = useFormik({
    initialValues: {
      email: email,
      otp: otp,
      password: "",
      confirmPassword: "",
    },
    validationSchema: ResetPassword_Validation,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        await resetPassword({
          email: values.email,
          otp: values.otp,
          password: values.password
        });
      } catch (err: any) {
        showSnackbar(err?.response?.data?.message || err.message || "An error occurred", "error");
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
                Reset Password
              </Typography>
              <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                Enter the OTP sent to your email and set a new password.
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                margin="normal"
                fullWidth
                name="password"
                label="New Password"
                type={showPassword ? "text" : "password"}
                id="password"
                sx={textFieldStyles}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: colors.TEXT_SECONDARY }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.password && Boolean(formik.errors.password)
                }
                helperText={formik.touched.password && formik.errors.password}
              />

              <TextField
                margin="normal"
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                sx={textFieldStyles}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                          sx={{ color: colors.TEXT_SECONDARY }}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)
                }
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
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
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

const ResetPassword = () => {
  return (
    <Suspense fallback={<Box>Loading...</Box>}>
      <ResetPasswordForm />
    </Suspense>
  );
};

export default ResetPassword;
