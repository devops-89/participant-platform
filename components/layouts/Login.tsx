"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { useLogin } from "@/hooks/auth/useLogin";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { Login_Validation } from "@/utils/validation";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React from "react";

import { useSnackbar } from "@/context/SnackbarContext";

const Login = () => {
  const { colors, mode } = useAppTheme();
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const { showSnackbar } = useSnackbar();
  const { isChecking } = useGuestGuard();

  const { login, isLoading, error: apiError } = useLogin();

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Login_Validation,
    onSubmit: async (values, { setFieldError }) => {
      try {
        await login(values);
      } catch (err: any) {
        const message = err.message || "An error occurred during login";
        
        const lowerMsg = message.toLowerCase();
        
        // Map generic invalid credentials to a clearer message for the user
        const displayMessage = lowerMsg.includes("credential") ? "Incorrect email or password" : message;
        
        showSnackbar(displayMessage, "error");
      }
    },
  });



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
        <form onSubmit={formik.handleSubmit} autoComplete="off">
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
                Welcome Back
              </Typography>
              <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            {/* Dummy fields to intercept browser autofill */}
            <input type="email" name="fakeemailremembered" style={{ display: 'none' }} />
            <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                variant="outlined"
                sx={textFieldStyles}

                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                autoComplete="off"
              />
              <TextField
                fullWidth
                name="password"
                label="Password"
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
                autoComplete="off"
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mt: 1,
                  mb: 2,
                }}
              >
                <Link
                  href="/signup"
                  variant="body2"
                  sx={{
                    color: colors.PRIMARY,
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Don't have an account? Sign Up
                </Link>
                <Link
                  href="/forgot-password"
                  variant="body2"
                  sx={{
                    color: colors.PRIMARY,
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

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
                {isLoading ? "Signing In..." : "Sign In"}
              </Button>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
};

export default Login;
