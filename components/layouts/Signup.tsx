"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  FormControl,
  FormHelperText,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import * as Yup from "yup";
import { AuthControllers } from "../../api/authControllers";
import { contestControllers } from "../../api/contestControllers";
import { FORM_CONTROLLERS } from "../../api/formControllers";
import { ContestTemplateField, ParticipantSignupPayload } from "../../types/user";

import { useSnackbar } from "@/context/SnackbarContext";

export default function Signup() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const [contests, setContests] = useState<any[]>([]);
  const [apiCountries, setApiCountries] = useState<any[]>([]);
  const [templateFields, setTemplateFields] = useState<ContestTemplateField[]>([]);
  
  const [isLoadingContests, setIsLoadingContests] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});

  const [selectedContestId, setSelectedContestId] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const countriesResponse = await AuthControllers.getCountries();
        
        // Extract Countries
        const countryData = countriesResponse?.data || countriesResponse || [];
        setApiCountries(Array.isArray(countryData) ? countryData : []);
        
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        showSnackbar("Failed to load necessary form data.", "error");
      } finally {
        setIsLoadingContests(false);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch contests when a country is selected
  useEffect(() => {
    if (selectedCountryId && apiCountries.length > 0) {
      const fetchContestsByCountry = async () => {
        setIsLoadingContests(true);
        try {
          const selectedCountry = apiCountries.find(c => c.id === selectedCountryId);
          const countryQuery = selectedCountry ? selectedCountry.name : "";
          
          const contestResponse = await contestControllers.getContest(countryQuery);
          const contestData = contestResponse?.data?.data?.docs || contestResponse?.data?.docs || contestResponse?.data || contestResponse || [];
          setContests(Array.isArray(contestData) ? contestData : []);
          
          // Reset selected contest
          setSelectedContestId("");
        } catch (error) {
          console.error("Failed to fetch contests", error);
        } finally {
          setIsLoadingContests(false);
        }
      };
      fetchContestsByCountry();
    } else {
      setContests([]);
    }
  }, [selectedCountryId, apiCountries]);

  const buildValidationSchema = () => {
    const shape: any = {
      contestId: Yup.string().required("Please select a contest"),
      countryId: Yup.string().required("Please select a country"),
    };

    templateFields.forEach((field) => {
      let validator = Yup.string();
      if (field.required) {
        validator = validator.required(`${field.label} is required`);
      }
      if (field.type === "email" || field.label.toLowerCase().includes("email")) {
        validator = validator.email("Invalid email format");
      }
      shape[field.id] = validator;
    });

    return Yup.object().shape(shape);
  };

  const getInitialValues = () => {
    const values: Record<string, any> = {
      contestId: selectedContestId,
      countryId: selectedCountryId,
    };
    templateFields.forEach((field) => {
      values[field.id] = "";
    });
    return values;
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: getInitialValues(),
    validationSchema: buildValidationSchema(),
    onSubmit: async (values) => {
      try {
        setIsLoading(true);

        const hasFiles = Object.values(values).some(v => v instanceof File);
        let payload: any;

        if (hasFiles) {
          payload = new FormData();
          payload.append("contestId", values.contestId);
          payload.append("countryId", values.countryId);
          
          Object.keys(values).forEach((key) => {
            if (key !== "contestId" && key !== "countryId" && values[key] !== undefined && values[key] !== null && values[key] !== "") {
              payload.append(`formData[${key}]`, values[key]);
            }
          });
        } else {
          const formData: Record<string, any> = {};
          Object.keys(values).forEach((key) => {
            if (key !== "contestId" && key !== "countryId") {
              formData[key] = values[key];
            }
          });

          payload = {
            contestId: values.contestId,
            countryId: values.countryId,
            formData,
          };
        }

        const res = await AuthControllers.registerParticipants(payload);
        console.log("Signup API Response:", res?.data);
        
        showSnackbar(res?.data?.message || "Participant registered successfully. Please verify the OTP sent to your email.", "success");
        
        const registeredEmail = res?.data?.data?.email || res?.data?.email || "";
        setTimeout(() => {
          setIsLoading(false);
          router.push(`/verify-otp?email=${encodeURIComponent(registeredEmail)}`);
        }, 2000);
      } catch (err: any) {
        setIsLoading(false);
        showSnackbar(err?.response?.data?.message || err?.message || "Signup failed", "error");
      }
    },
  });

  // Handle contest selection change to fetch dynamic fields
  useEffect(() => {
    const contestId = formik.values.contestId;
    if (contestId) {
      const fetchTemplate = async () => {
        setIsLoadingTemplate(true);
        try {
          const res = await contestControllers.getContestDetails(contestId);
          let fields = res?.data?.userLevelTemplate?.schema?.fields || res?.userLevelTemplate?.schema?.fields;
          
          if (!fields || fields.length === 0) {
            // Fallback: If template schema is not populated, fetch it using the template ID
            const templateId = res?.data?.user_level_template_id || res?.user_level_template_id;
            if (templateId) {
              const templateRes = await FORM_CONTROLLERS.getTemplateById(templateId);
              fields = templateRes?.data?.data?.schema?.fields || templateRes?.data?.schema?.fields || [];
            } else {
              fields = [];
            }
          }
          
          setTemplateFields(fields);
        } catch (error) {
          console.error("Failed to fetch contest template", error);
          showSnackbar("Failed to load registration fields for the selected contest.", "error");
          setTemplateFields([]);
        } finally {
          setIsLoadingTemplate(false);
        }
      };
      fetchTemplate();
    } else {
      setTemplateFields([]);
    }
  }, [selectedContestId]);

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

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
                Create an Account
              </Typography>
              <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY }}>
                Register to participate in contests
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Country Selector */}
              <FormControl fullWidth margin="normal" error={formik.touched.countryId && Boolean(formik.errors.countryId)}>
                <InputLabel id="country-select-label" sx={{ color: colors.TEXT_SECONDARY, "&.Mui-focused": { color: colors.PRIMARY } }}>Country</InputLabel>
                <Select
                  labelId="country-select-label"
                  id="countryId"
                  name="countryId"
                  value={formik.values.countryId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    setSelectedCountryId(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  label="Country"
                  sx={textFieldStyles}
                  MenuProps={{
                    sx: {
                      "& .MuiPaper-root": {
                        maxHeight: 250,
                      },
                    },
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left",
                    },
                    transformOrigin: {
                      vertical: "top",
                      horizontal: "left",
                    },
                  }}
                >
                  {apiCountries.map((country) => (
                    <MenuItem key={country.id} value={country.id}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.countryId && formik.errors.countryId && (
                  <FormHelperText>{formik.errors.countryId as string}</FormHelperText>
                )}
              </FormControl>

              {/* Contest Selector */}
              <FormControl fullWidth margin="normal" error={formik.touched.contestId && Boolean(formik.errors.contestId)}>
                <InputLabel id="contest-select-label" sx={{ color: colors.TEXT_SECONDARY, "&.Mui-focused": { color: colors.PRIMARY } }}>Contest</InputLabel>
                <Select
                  labelId="contest-select-label"
                  id="contestId"
                  name="contestId"
                  value={formik.values.contestId}
                  onChange={(e) => {
                    formik.handleChange(e);
                    setSelectedContestId(e.target.value);
                  }}
                  onBlur={formik.handleBlur}
                  label="Contest"
                  disabled={isLoadingContests}
                  sx={textFieldStyles}
                >
                  {contests.map((contest: any) => (
                    <MenuItem key={contest.id} value={contest.id}>
                      {contest.name || contest.title}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.contestId && formik.errors.contestId && (
                  <FormHelperText>{formik.errors.contestId as string}</FormHelperText>
                )}
              </FormControl>

              {isLoadingTemplate && (
                <Typography variant="body2" sx={{ color: colors.PRIMARY, mt: 2, textAlign: "center" }}>
                  Loading registration fields...
                </Typography>
              )}

              {/* Dynamic Fields */}
              {!isLoadingTemplate && templateFields.map((field) => {
                const isPassword = field.type === "password" || field.label.toLowerCase().includes("password");
                const showPassword = showPasswordMap[field.id] || false;

                if (field.type === "select" || field.type === "dropdown" || field.type === "countrySelector") {
                  return (
                    <FormControl key={field.id} fullWidth margin="normal" error={formik.touched[field.id] && Boolean(formik.errors[field.id])}>
                      <InputLabel id={`label-${field.id}`} sx={{ color: colors.TEXT_SECONDARY, "&.Mui-focused": { color: colors.PRIMARY } }}>{field.label}</InputLabel>
                      <Select
                        labelId={`label-${field.id}`}
                        id={field.id}
                        name={field.id}
                        value={formik.values[field.id] || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={field.label}
                        sx={textFieldStyles}
                        MenuProps={{
                          sx: {
                            "& .MuiPaper-root": {
                              maxHeight: 250,
                            },
                          },
                          anchorOrigin: {
                            vertical: "bottom",
                            horizontal: "left",
                          },
                          transformOrigin: {
                            vertical: "top",
                            horizontal: "left",
                          },
                        }}
                      >
                        {field.type === "countrySelector" ? (
                           apiCountries.map((country) => (
                            <MenuItem key={country.id} value={country.name}>
                              {country.name}
                            </MenuItem>
                          ))
                        ) : (
                          (Array.isArray(field.options) ? field.options : []).map((opt: any, idx: number) => (
                            <MenuItem key={idx} value={opt?.value || opt}>
                              {opt?.label || opt}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                      {formik.touched[field.id] && formik.errors[field.id] && (
                        <FormHelperText>{formik.errors[field.id] as string}</FormHelperText>
                      )}
                    </FormControl>
                  );
                }

                if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
                  return (
                    <Box key={field.id} sx={{ mt: 2, mb: 1, p: 2, border: "1px dashed", borderColor: colors.BORDER, borderRadius: "10px", textAlign: "center" }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.TEXT_PRIMARY }}>
                        {field.label} {field.required && "*"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                        {field.config?.allowedExtensions ? `Allowed: ${field.config?.allowedExtensions}` : "All files allowed"} 
                        {field.config?.maxSize ? ` (Max: ${field.config?.maxSize}MB)` : ""}
                      </Typography>
                      <Button variant="outlined" component="label" size="small" sx={{ borderColor: colors.BORDER, color: colors.TEXT_PRIMARY, '&:hover': { borderColor: colors.PRIMARY } }}>
                        Upload File
                        <input 
                          type="file" 
                          hidden 
                          accept={field.config?.allowedExtensions || undefined}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              formik.setFieldValue(field.id, e.target.files[0]);
                            }
                          }}
                        />
                      </Button>
                      {formik.values[field.id] && (
                        <Typography variant="caption" sx={{ display: "block", mt: 1, color: colors.TEXT_PRIMARY }}>
                          Selected: {(formik.values[field.id] as unknown as File).name || "File attached"}
                        </Typography>
                      )}
                      {formik.touched[field.id] && formik.errors[field.id] && (
                        <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
                          {formik.errors[field.id] as string}
                        </FormHelperText>
                      )}
                    </Box>
                  );
                }

                return (
                  <TextField
                    key={field.id}
                    margin="normal"
                    fullWidth
                    id={field.id}
                    name={field.id}
                    label={field.label}
                    placeholder={field.placeholder}
                    type={isPassword ? (showPassword ? "text" : "password") : field.type || "text"}
                    variant="outlined"
                    sx={textFieldStyles}
                    value={formik.values[field.id] || ""}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched[field.id] && Boolean(formik.errors[field.id])}
                    helperText={(formik.touched[field.id] && formik.errors[field.id]) as string || field.helperText}
                    slotProps={isPassword ? {
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => togglePasswordVisibility(field.id)}
                              edge="end"
                              sx={{ color: colors.TEXT_SECONDARY }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    } : undefined}
                  />
                );
              })}

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  mt: 2,
                  mb: 1,
                }}
              >
                <Link
                  href="/"
                  variant="body2"
                  sx={{
                    color: colors.PRIMARY,
                    textDecoration: "none",
                    fontWeight: 600,
                    "&:hover": { textDecoration: "underline" },
                  }}
                >
                  Already have an account? Sign In
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isLoading || isLoadingContests || isLoadingTemplate || (!formik.values.contestId)}
                sx={{
                  mt: 2,
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
                {isLoading ? "Creating Account..." : "Sign Up"}
              </Button>
            </Box>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
