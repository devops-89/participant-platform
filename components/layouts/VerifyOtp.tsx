"use client";

import { useAppTheme } from "@/context/ThemeContext";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { AuthControllers } from "../../api/authControllers";

import { useSnackbar } from "@/context/SnackbarContext";

export default function VerifyOtp() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const { showSnackbar } = useSnackbar();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    if (apiError) {
      showSnackbar(apiError, "error");
    }
  }, [apiError, showSnackbar]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow pasting full 6 digits
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

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");
    
    if (otpValue.length !== 6) {
      setApiError("Please enter all 6 digits of the OTP.");
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const payload = {
        email: email || "",
        otp: otpValue
      };

      const res = await AuthControllers.verifyOtp(payload);
      console.log("Verify OTP API Response:", res?.data);
      showSnackbar("OTP verified registered successfully", "success");
      
      // Store token if returned
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
    } catch (err: any) {
      console.error(err);
      setApiError(err?.response?.data?.message || err?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
        <form onSubmit={handleSubmit}>
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
              Verify Your Email
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
                      maxLength: 6, // to allow pasting 6 digits
                      inputMode: "numeric"
                    }
                  }}
                />
              ))}
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={isLoading || otp.join("").length !== 6}
              sx={{
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
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                Didn't receive the code?{" "}
                <Button 
                  variant="text" 
                  sx={{ textTransform: "none", p: 0, minWidth: "auto", fontWeight: 600 }}
                  onClick={() => router.push("/signup")}
                >
                  Go Back
                </Button>
              </Typography>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
