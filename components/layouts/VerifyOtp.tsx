"use client";

import { Visibility, VisibilityOff } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

import { useFormik } from "formik";
import { useRouter, useSearchParams } from "next/navigation";
import * as Yup from "yup";

import { useSnackbar } from "@/context/SnackbarContext";
import { useAppTheme } from "@/context/ThemeContext";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { AuthControllers } from "../../api/authControllers";

export default function VerifyOtp() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const flow = searchParams.get("flow");
  const { showSnackbar } = useSnackbar();

  const { isChecking } = useGuestGuard();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCanResend(true);
    }
  }, [timer]);

  const handleResendOtp = async () => {
    try {
      const emailParam = email || localStorage.getItem("resetEmail");
      if (!emailParam) {
        showSnackbar("Email not found. Please try again.", "error");
        return;
      }
      
      setLoading(true);
      await AuthControllers.resendOtp({ email: emailParam });
      showSnackbar("OTP resent successfully", "success");
      setTimer(60);
      setCanResend(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      showSnackbar(
        err?.response?.data?.message || "Failed to resend OTP",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: flow === "forgot" ? Yup.object({
      newPassword: Yup.string()
        .min(8, "Password must be at least 8 characters")
        .matches(/[A-Z]/, "Password must include at least one uppercase letter")
        .matches(/[a-z]/, "Password must include at least one lowercase letter")
        .matches(/[0-9]/, "Password must include at least one number")
        .matches(
          /[!@#$%^&*(),.?":{}|<>]/,
          "Password must include at least one special character",
        )
        .required("Please Enter Password"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Passwords must match")
        .required("Please Confirm Your Password"),
    }) : Yup.object({}),

    onSubmit: async (values) => {
      try {
        setLoading(true);
        const otpValue = otp.join("");
        
        if (otpValue.length !== 6) {
          showSnackbar("Please enter all 6 digits of the OTP.", "error");
          setLoading(false);
          return;
        }

        const emailParam = email || localStorage.getItem("resetEmail") || "";

        if (flow === "forgot") {
          const response = await AuthControllers.resetPassword({
            email: emailParam,
            otp: otpValue,
            password: values.newPassword,
          });

          if (response.data && response.data.success === false) {
            throw new Error(response.data.message || "Invalid OTP or OTP expired");
          }

          showSnackbar(
            response?.data?.message || "Password reset successfully!",
            "success"
          );

          setTimeout(() => {
            router.push("/");
          }, 1000);
          return;
        }

        const payload = {
          email: emailParam,
          otp: otpValue
        };

        const res = await AuthControllers.verifyOtp(payload);
        if (res.data && (res.data.success === false || res.data.status === false || res.data.error)) {
          throw new Error(res.data.message || "Invalid OTP or OTP expired");
        }
        showSnackbar("Registration successful", "success");
        
        const token = res?.data?.data?.accessToken || res?.data?.accessToken || res?.data?.data?.token || res?.data?.token;
        if (token) {
          localStorage.setItem("accessToken", token);
        }
        
        const refreshToken = res?.data?.data?.refreshToken || res?.data?.refreshToken;
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        const userData = res?.data?.data?.user || res?.data?.user;
        if (userData) {
          localStorage.setItem("user", JSON.stringify(userData));
        }
        
        router.push("/dashboard");
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }, message?: string };
        let errorMessage = err?.response?.data?.message || err?.message || "OTP is Invalid or Expired";
        
        const lowerMsg = errorMessage.toLowerCase();
        
        if (
          lowerMsg.includes("validation error") || 
          lowerMsg.includes("invalid") || 
          lowerMsg.includes("expired")
        ) {
          errorMessage = "OTP is Invalid or Expired";
        }
        
        showSnackbar(errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
  });

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length === 6) {
      const chars = value.split("");
      for (let i = 0; i < 6; i++) {
        newOtp[i] = chars[i] || "";
      }
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
      return;
    }

    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  if (isChecking) {
    return null;
  }

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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
        padding: 2,
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
              textAlign: "center",
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                variant="text"
                onClick={() => router.back()}
                startIcon={<ArrowBackIcon />}
                sx={{
                  color: colors.TEXT_SECONDARY,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "transparent", color: colors.PRIMARY },
                }}
              >
                Back
              </Button>
            </Box>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 800,
                color: colors.TEXT_PRIMARY,
                letterSpacing: "-0.025em",
                mb: 1
              }}
            >
              {flow === "forgot" ? "Reset Password" : "Verify Your Email"}
            </Typography>
            <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY, mb: 4 }}>
              We sent a 6-digit verification code to<br />
              <strong>{email || "your email"}</strong>
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 4 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  inputRef={(el) => { inputRefs.current[index] = el; }}
                  variant="outlined"
                  sx={{
                    width: { xs: "40px", sm: "50px" },
                    "& .MuiOutlinedInput-root": {
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      textAlign: "center",
                      color: colors.PRIMARY,
                      "& fieldset": { borderColor: colors.BORDER },
                      "&:hover fieldset": { borderColor: colors.PRIMARY },
                      "&.Mui-focused fieldset": { borderColor: colors.PRIMARY, borderWidth: "2px" },
                    },
                    "& input": {
                      textAlign: "center",
                      p: { xs: 1.5, sm: 2 },
                    }
                  }}
                  slotProps={{
                    htmlInput: {
                      maxLength: 6,
                      inputMode: "numeric"
                    }
                  }}
                />
              ))}
            </Box>

            {flow === "forgot" && (
              <Box sx={{ mt: 4, textAlign: "left" }}>
                <TextField
                  fullWidth margin="normal" label="New Password" autoComplete="new-password" name="newPassword" type={showPassword ? "text" : "password"} sx={textFieldStyles}
                  value={formik.values.newPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.newPassword && Boolean(formik.errors.newPassword)}
                  helperText={formik.touched.newPassword && formik.errors.newPassword as string}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <TextField
                  fullWidth margin="normal" label="Confirm Password" autoComplete="new-password" name="confirmPassword" type={showConfirmPassword ? "text" : "password"} sx={textFieldStyles}
                  value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                  error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                  helperText={formik.touched.confirmPassword && formik.errors.confirmPassword as string}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>
            )}

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || otp.join("").length !== 6}
              sx={{
                py: 1.5,
                mt: flow === "forgot" ? 4 : 0,
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
              {loading ? (flow === "forgot" ? "Resetting..." : "Verifying...") : (flow === "forgot" ? "Reset Password" : "Verify OTP")}
            </Button>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                Didn&apos;t receive the code?{" "}
                {canResend ? (
                  <Button 
                    variant="text" 
                    sx={{ textTransform: "none", p: 0, minWidth: "auto", fontWeight: 600, color: colors.PRIMARY, "&:hover": { bgcolor: "transparent", textDecoration: "underline" } }}
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    Resend OTP
                  </Button>
                ) : (
                  <Typography component="span" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
                    Resend in {formatTimer(timer)}
                  </Typography>
                )}
              </Typography>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
