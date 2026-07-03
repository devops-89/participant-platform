"use client";

import { useAppTheme } from "@/context/ThemeContext";
import Breadcrumb from "@/components/widgets/Breadcrumb";
import { Edit as EditIcon, Close as CloseIcon } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Checkbox,
  Collapse,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import * as Yup from "yup";
import { AuthControllers } from "../../api/authControllers";
import { ContestTemplateField } from "../../types/user";
import { FilePreview } from "../widgets/FilePreview";

import { useSnackbar } from "@/context/SnackbarContext";

export default function Profile() {
  const { colors } = useAppTheme();
  const { showSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateFields, setTemplateFields] = useState<ContestTemplateField[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [apiCountries, setApiCountries] = useState<any[]>([]);

  const fetchProfileData = async () => {
    try {
      setIsLoading(true);
      // Fetch user data
      const participantRes = await AuthControllers.getParticipants();
      const user = participantRes?.data?.data || participantRes?.data || participantRes;
      
      if (!user) throw new Error("Failed to load user profile");
      setUserData(user);

      // Extract template schema directly from user data to render dynamic fields
      const contestObj = user.participants?.[0]?.contest;
      const fields = user?.formTemplate?.schema?.fields || contestObj?.userLevelTemplate?.schema?.fields || [];
      
      // Exclude password fields and email
      const filteredFields = fields.filter(
        (f: any) => f.type !== "password" && f.label?.toLowerCase() !== "confirm password" && f.label?.toLowerCase() !== "email"
      );
      setTemplateFields(filteredFields);
      // Fetch countries
      const countriesRes = await AuthControllers.getCountries();
      const countryData = countriesRes?.data || countriesRes || [];
      setApiCountries(Array.isArray(countryData) ? countryData : []);
    } catch (error) {
      console.error("Profile fetch error", error);
      showSnackbar("Could not load profile details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const subData = (userData?.participant_profile_data && Object.keys(userData.participant_profile_data).length > 0) 
    ? userData.participant_profile_data 
    : (userData?.participantProfile?.submission?.data || userData?.participants?.[0]?.submission?.data || {});
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: templateFields.reduce((acc, field) => {
      let val = subData[field.id] || "";
      if (field.type === "file_upload" || field.type === "image") {
        val = subData[field.id] || subData['file'] || userData?.participant_profile_data?.file || "";
      }
      if (field.type === "boolean" || field.type === "switch" || field.type === "checkbox") {
        val = val === "true" || val === true;
      }
      acc[field.id] = val;
      return acc;
    }, {} as Record<string, any>),
    validationSchema: Yup.object(
      templateFields.reduce((acc, field) => {
        let validator: any = Yup.string();

        if (field.required) {
          validator = validator.test(
            "required-trim",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : value !== false)
          );
        }

        if (field.type === "numberField" || field.type === "number" || field.type === "slider" || field.type === "rating") {
          validator = Yup.number().typeError(`${field.label} must be a number`);
          if (field.required) validator = validator.required(`${field.label} is required`);
        } else if (field.type === "boolean" || field.type === "switch" || field.type === "checkbox") {
          validator = Yup.boolean();
        } else if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
          validator = Yup.mixed().nullable();
          
          if (field.config?.maxSize) {
            const maxSize = Number(field.config.maxSize) * 1024 * 1024;
            validator = validator.test(
              "fileSize",
              `File size is too large (Max: ${field.config.maxSize}MB)`,
              (value: any) => {
                if (!value) return true;
                if (value instanceof File) return value.size <= maxSize;
                return true;
              }
            );
          }

          if (field.config?.allowedExtensions) {
            const allowed = typeof field.config.allowedExtensions === 'string' 
              ? field.config.allowedExtensions.split(",").map((e: string) => e.trim().toLowerCase()) 
              : field.config.allowedExtensions;
            validator = validator.test(
              "fileType",
              `Unsupported file type (Allowed: ${allowed.join(", ")})`,
              (value: any) => {
                if (!value) return true;
                if (value instanceof File) {
                  const extMatch = value.name.match(/\.[0-9a-z]+$/i);
                  const extension = extMatch ? extMatch[0].toLowerCase() : "";
                  return allowed.includes(extension);
                }
                return true;
              }
            );
          }

          if (field.required) {
            validator = validator.test(
              "fileRequired",
              `${field.label} is required`,
              (value: any) => {
                return value !== null && value !== undefined && value !== "";
              }
            );
          }
        }

        if (field.type === "telInput") {
          validator = validator.test(
            "isValidTel",
            "Invalid phone number",
            (value: any) => {
              if (!value) return !field.required;
              return matchIsValidTel(value);
            }
          );
        }

        const isPassword = field.type === "password" || (field.label && field.label.toLowerCase().includes("password"));
        if (isPassword) {
          validator = validator
            .min(8, "Password must be at least 8 characters")
            .matches(/[A-Z]/, "Password must include at least one uppercase letter")
            .matches(/[0-9]/, "Password must include at least one number")
            .matches(
              /[!@#$%^&*(),.?":{}|<>]/,
              "Password must include at least one special character"
            );
        }

        // Date validation
        if (
          field.type === "datePicker" ||
          (field.label && (field.label.toLowerCase().includes("date of birth") || field.label.toLowerCase().includes("dob") || field.label.toLowerCase().includes("birth")))
        ) {
          validator = Yup.mixed()
            .test("isValidDate", "Invalid date format", (value: any) => {
              if (!value) return !field.required;
              return dayjs(value).isValid();
            });

          if ((field.label && (field.label.toLowerCase().includes("dob") || field.label.toLowerCase().includes("birth") || field.label.toLowerCase().includes("date of birth"))) || field.config?.disableFuture) {
            validator = validator.test("noFutureDate", "Date cannot be in the future", (value: any) => {
              if (!value) return true;
              return dayjs(value).isBefore(dayjs().endOf('day'));
            });
          }

          if (field.label && field.label.toLowerCase().includes("birth")) {
             validator = validator.test('age-range', 'Age must be between 10 and 25 years', (val: any) => {
                if (!val) return true;
                const diff = dayjs().diff(dayjs(val), 'year');
                return diff >= 10 && diff <= 25;
             });
          }

          if (field.config?.disablePast) {
            validator = validator.test("noPastDate", "Date cannot be in the past", (value: any) => {
              if (!value) return true;
              return dayjs(value).isAfter(dayjs().startOf('day'));
            });
          }
        }

        // Name fields validation
        if (
          field.label && (
          field.label.toLowerCase() === "name" ||
          field.label.toLowerCase() === "first name" ||
          field.label.toLowerCase() === "last name" ||
          field.label.toLowerCase() === "full name" ||
          field.label.toLowerCase() === "father's name" ||
          field.label.toLowerCase() === "mother's name")
        ) {
          validator = validator.matches(
            /^[A-Za-z\s]+$/,
            "Only alphabets and spaces are allowed"
          );
        }
        
        // School Name validation
        if (field.label && field.label.toLowerCase().includes("school name")) {
          validator = validator.matches(
            /^[A-Za-z0-9\s'.-]+$/,
            "Only alphabets, numbers, and basic punctuation are allowed"
          );
        }

        // Country of Residence validation
        if (field.type !== "countrySelector" && field.label && field.label.toLowerCase().includes("country of residence")) {
          validator = validator.matches(
            /^[A-Za-z\s'-]+$/,
            "Only alphabetic characters are allowed"
          );
        }

        if (field.label && field.label.toLowerCase() === "innovation title") {
          validator = validator.matches(
            /^[A-Za-z\s]+$/,
            "Only alphabets and spaces are allowed"
          );
        }

        if (
          field.type === "email" ||
          (field.label && field.label.toLowerCase().includes("email"))
        ) {
          validator = validator.matches(
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
            "Invalid email format"
          );
        }

        acc[field.id] = validator;
        return acc;
      }, {} as Record<string, any>)
    ),
    onSubmit: async (values) => {
      // Check if any value actually changed before sending to backend
      const hasChanges = Object.keys(values).some((key) => {
        if (values[key] instanceof File) return true;
        
        const initial = formik.initialValues[key] || "";
        const current = values[key] || "";
        
        return String(initial) !== String(current);
      });

      if (!hasChanges) {
        showSnackbar("No changes to update", "warning");
        return;
      }

      setIsUpdating(true);
      try {
        const payload = new FormData();
        Object.keys(values).forEach((key) => {
          if (values[key] !== undefined && values[key] !== null) {
            const fieldMatch = templateFields.find(f => f.id === key);
            if (fieldMatch && (fieldMatch.type === "file_upload" || fieldMatch.type === "image")) {
              if (values[key] instanceof File) {
                payload.append(key, values[key]);
              } else if (typeof values[key] === "string") {
                payload.append(key, values[key]);
              }
            } else {
              payload.append(key, values[key]);
            }
          }
        });

        await AuthControllers.updateUserDetails(userData?.id, payload);
        
        showSnackbar("Profile updated successfully!", "success");
        await fetchProfileData(); // Fetch latest data
        window.dispatchEvent(new Event("profileUpdated")); // Notify Header to update avatar/details
        setIsEditing(false); // Close edit view after successful update
      } catch (error) {
        showSnackbar("Failed to update profile", "error");
      } finally {
        setIsUpdating(false);
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

  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: colors.BACKGROUND }}>
        <Typography color={colors.TEXT_PRIMARY}>Loading Profile...</Typography>
      </Box>
    );
  }

  // Extract avatar
  let foundAvatar = "";
  if (subData) {
    const imageKey = Object.keys(subData).find((k) => k.endsWith('_downloadUrl'));
    if (imageKey) {
      foundAvatar = subData[imageKey];
    } else if (subData['file_downloadUrl']) {
      foundAvatar = subData['file_downloadUrl'];
    } else if (subData['file']) {
      foundAvatar = subData['file'];
    }
  }
  if (!foundAvatar && userData?.participant_profile_data?.file) {
    foundAvatar = userData.participant_profile_data.file;
  }
  if (!foundAvatar) foundAvatar = userData?.avatarDownloadUrl || userData?.avatarUrl || "";

  const userName = userData?.fullName || userData?.firstName || "Participant";
  const displayFields = templateFields.filter(f => f.type !== "file_upload" && f.type !== "image");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        boxSizing: "border-box",
        pt: { xs: 2, md: 4 },
        pb: 8,
        px: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ mb: 4 }}>
          <Breadcrumb 
            title="Profile Details"
            data={[
              { title: "Dashboard", href: "/dashboard" },
              { title: "Profile Details", href: "#" },
            ]}
          />
        </Box>
        {/* Profile Card */}
        <Paper
          elevation={0}
          sx={{
            padding: { xs: 3, md: 4 },
            borderRadius: 4,
            background: "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${colors.BORDER}`,
            boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY }}>
              Profile Summary
            </Typography>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(!isEditing)}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                color: isEditing ? colors.TEXT_SECONDARY : colors.PRIMARY,
                borderColor: isEditing ? colors.BORDER : colors.PRIMARY,
                "&:hover": {
                  borderColor: isEditing ? colors.BORDER : colors.PRIMARY,
                  bgcolor: isEditing ? "rgba(0,0,0,0.05)" : "transparent",
                }
              }}
            >
              {isEditing ? "Cancel" : "Edit Details"}
            </Button>
          </Box>
          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={4}>
            {/* Left Column: Avatar & Contact Info */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: { xs: 2, md: 0 }, pb: 4, px: 2, height: "100%", justifyContent: "flex-start" }}>
                <Avatar
                  src={foundAvatar || undefined}
                  sx={{
                    width: 160,
                    height: 160,
                    mb: 3,
                    border: `4px solid #fff`,
                    boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                    bgcolor: colors.PRIMARY,
                    fontSize: "4rem"
                  }}
                >
                  {!foundAvatar && userName ? userName.charAt(0).toUpperCase() : null}
                </Avatar>
                
                <Typography variant="h5" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY }}>
                  {userName}
                </Typography>
                
                <Box sx={{ mt: 1, textAlign: "center" }}>
                  <Typography variant="body1" sx={{ color: colors.TEXT_SECONDARY, fontWeight: 500 }}>
                    {userData?.email || "Not Provided"}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Right Column: Dynamic Data Summary */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Grid container spacing={3} sx={{ mt: { xs: 0, md: 2 } }}>
                {displayFields.length > 0 ? (
                  displayFields.map((field) => {
                    let val = subData[field.id];
                    
                    // Format dates safely
                    if (field.type === "datePicker" && val) {
                      val = dayjs(val).format("MMMM D, YYYY");
                    } else if (field.type === "boolean" || field.type === "switch" || field.type === "checkbox") {
                      val = val === "true" || val === true ? "Yes" : "No";
                    }

                    return (
                      <Grid size={{ xs: 12, sm: 6 }} key={field.id}>
                        <Box>
                          <Typography variant="caption" sx={{ color: colors.TEXT_SECONDARY, fontWeight: 600, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                            {field.label}
                          </Typography>
                          <Typography variant="body1" sx={{ color: colors.TEXT_PRIMARY }}>
                            {val ? String(val) : "-"}
                          </Typography>
                        </Box>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid size={{ xs: 12 }}>
                    <Typography sx={{ color: colors.TEXT_SECONDARY }}>No additional details found.</Typography>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        {/* Collapsible Edit Section */}
        <Collapse in={isEditing}>
          <Paper
            elevation={0}
            sx={{
              mt: 3,
              padding: { xs: 3, md: 4 },
              borderRadius: 4,
              background: "rgba(255, 255, 255, 0.9)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${colors.BORDER}`,
              boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY, mb: 1 }}>
                Update Information
              </Typography>
              <Typography variant="body2" sx={{ color: colors.TEXT_SECONDARY }}>
                Edit your profile details below. Email and password changes are not permitted here.
              </Typography>
            </Box>

            <form onSubmit={formik.handleSubmit} autoComplete="off">
              <Grid container spacing={3}>
                {templateFields.map((field) => {
                  if (field.type === "select" || field.type === "dropdown") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          fullWidth
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                        >
                          <InputLabel id={`${field.id}-label`} sx={{ color: colors.TEXT_SECONDARY }}>
                            {field.label} {field.required ? "*" : ""}
                          </InputLabel>
                          <Select
                            labelId={`${field.id}-label`}
                            id={field.id}
                            name={field.id}
                            value={formik.values[field.id] || ""}
                            label={`${field.label} ${field.required ? "*" : ""}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            sx={textFieldStyles}
                          >
                            {field.options?.map((opt: any, i: number) => (
                              <MenuItem key={i} value={opt}>
                                {opt}
                              </MenuItem>
                            ))}
                          </Select>
                          {formik.touched[field.id] && formik.errors[field.id] && (
                            <FormHelperText>
                              {String(formik.errors[field.id])}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "file_upload" || field.type === "image") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <Box
                          sx={{
                            p: 1.5,
                            border: "1px dashed",
                            borderColor: colors.BORDER,
                            borderRadius: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 2,
                            width: "100%",
                            boxSizing: "border-box",
                            transition: "all 0.2s ease-in-out",
                            "&:hover": {
                              borderColor: colors.PRIMARY,
                            },
                          }}
                        >
                          
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <Typography variant="body2" sx={{ color: colors.TEXT_PRIMARY, fontWeight: 600 }}>
                              {field.label}{field.required && " *"}
                            </Typography>
                            
                            {!formik.values[field.id] && (
                              <Button
                                variant="outlined"
                                component="label"
                                size="small"
                                sx={{
                                  textTransform: "none",
                                  borderColor: colors.BORDER,
                                  color: colors.PRIMARY,
                                  whiteSpace: "nowrap",
                                  "&:hover": { borderColor: colors.PRIMARY },
                                }}
                              >
                                Upload New Image
                                <input
                                  type="file"
                                  hidden
                                  accept={field.config?.allowedExtensions || undefined}
                                  onChange={(e: any) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      formik.setFieldValue(field.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </Button>
                            )}
                          </Box>

                          {formik.values[field.id] && (
                            <Box sx={{ mt: 1, position: "relative", display: "flex", justifyContent: "flex-start", width: "100%" }}>
                              {(() => {
                                const fileVal = formik.values[field.id];
                                const downloadUrl = userData?.participant_profile_data?.[`${field.id}_downloadUrl`] 
                                  || userData?.participant_profile_data?.[`${field.label}_downloadUrl`] 
                                  || subData?.[`${field.id}_downloadUrl`] 
                                  || subData?.[`${field.label}_downloadUrl`];
                                return (
                                  <FilePreview 
                                    fileVal={fileVal} 
                                    previewUrl={typeof fileVal === "string" ? downloadUrl : undefined}
                                    label={field.label} 
                                    onClear={() => formik.setFieldValue(field.id, null)} 
                                  />
                                );
                              })()}
                            </Box>
                          )}
                        </Box>
                        {formik.touched[field.id] && formik.errors[field.id] && (
                          <FormHelperText error sx={{ mx: 2, mt: 0.5 }}>
                            {String(formik.errors[field.id])}
                          </FormHelperText>
                        )}
                      </Grid>
                    );
                  }

                  if (field.type === "radio" || field.type === "boolean") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          component="fieldset"
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                          sx={{ height: "100%", justifyContent: "center" }}
                        >
                          <FormLabel component="legend" sx={{ color: colors.TEXT_SECONDARY }}>
                            {field.label} {field.required ? "*" : ""}
                          </FormLabel>
                          <RadioGroup
                            row
                            name={field.id}
                            value={String(formik.values[field.id] || "")}
                            onChange={formik.handleChange}
                          >
                            {field.options?.map((opt: any, i: number) => (
                              <FormControlLabel
                                key={i}
                                value={opt}
                                control={<Radio sx={{ color: colors.PRIMARY, "&.Mui-checked": { color: colors.PRIMARY } }} />}
                                label={<Typography sx={{ color: colors.TEXT_PRIMARY }}>{opt}</Typography>}
                              />
                            ))}
                          </RadioGroup>
                          {formik.touched[field.id] && formik.errors[field.id] && (
                            <FormHelperText>
                              {String(formik.errors[field.id])}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "phone_number" || field.type === "telInput") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        {(() => {
                          const phoneVal = formik.values[field.id] || "";
                          const parsed = parsePhoneNumberFromString(phoneVal);
                          const countryCode = parsed?.country || field.config?.defaultCountry || "AE";
                          const example = getExampleNumber(countryCode as any, examples);
                          const maxLength = example ? example.formatInternational().length : 15;

                          return (
                            <MuiTelInput
                              onKeyDown={(e) => {
                                const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"];
                                if (phoneVal.length >= maxLength && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                                  e.preventDefault();
                                }
                              }}
                              fullWidth
                              id={field.id}
                              name={field.id}
                              label={`${field.label} ${field.required ? "*" : ""}`}
                              value={formik.values[field.id] || ""}
                              onChange={(value) => {
                                formik.setFieldValue(field.id, value);
                                formik.setFieldTouched(field.id, true, false);
                              }}
                              defaultCountry={field.config?.defaultCountry || "AE"}
                              onlyCountries={field.config?.onlyCountries || undefined}
                              error={formik.touched[field.id] && Boolean(formik.errors[field.id])}
                              helperText={formik.touched[field.id] && typeof formik.errors[field.id] === "string" ? String(formik.errors[field.id]) : undefined}
                              sx={textFieldStyles}
                            />
                          );
                        })()}
                      </Grid>
                    );
                  }

                  if (field.type === "checkbox") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                          sx={{ height: "100%", justifyContent: "center" }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                id={field.id}
                                name={field.id}
                                checked={Boolean(formik.values[field.id])}
                                onChange={formik.handleChange}
                                sx={{
                                  color: colors.BORDER,
                                  "&.Mui-checked": { color: colors.PRIMARY },
                                }}
                              />
                            }
                            label={
                              <Typography sx={{ color: colors.TEXT_PRIMARY }}>
                                {field.label} {field.required ? "*" : ""}
                              </Typography>
                            }
                          />
                          {formik.touched[field.id] && formik.errors[field.id] && (
                            <FormHelperText>
                              {String(formik.errors[field.id])}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "datePicker") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          {(() => {
                            const isBirthDate = field.label?.toLowerCase().includes("birth");
                            return (
                              <DatePicker
                                label={`${field.label} ${field.required ? "*" : ""}`}
                                value={formik.values[field.id] ? dayjs(formik.values[field.id]) : null}
                                onChange={(val) => {
                                  formik.setFieldValue(field.id, val ? val.toISOString() : null);
                                }}
                                sx={{ width: "100%", ...textFieldStyles }}
                                slotProps={{
                                  textField: {
                                    error: Boolean(formik.touched[field.id] && formik.errors[field.id]),
                                    helperText: (formik.touched[field.id] && formik.errors[field.id] as string) || undefined,
                                  }
                                }}
                                disablePast={isBirthDate ? false : field.config?.disablePast}
                                disableFuture={isBirthDate ? true : field.config?.disableFuture}
                                minDate={isBirthDate ? dayjs().subtract(25, 'year') : undefined}
                                maxDate={isBirthDate ? dayjs().subtract(10, 'year') : undefined}
                              />
                            );
                          })()}
                        </LocalizationProvider>
                      </Grid>
                    );
                  }

                  if (field.type === "countrySelector") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          fullWidth
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                        >
                          <InputLabel id={`${field.id}-label`} sx={{ color: colors.TEXT_SECONDARY }}>
                            {field.label} {field.required ? "*" : ""}
                          </InputLabel>
                          <Select
                            labelId={`${field.id}-label`}
                            id={field.id}
                            name={field.id}
                            value={formik.values[field.id] || ""}
                            label={`${field.label} ${field.required ? "*" : ""}`}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            sx={textFieldStyles}
                          >
                            {apiCountries.map((country: any) => (
                              <MenuItem key={country.id} value={country.name || country.id}>
                                {country.name}
                              </MenuItem>
                            ))}
                          </Select>
                          {formik.touched[field.id] && formik.errors[field.id] && (
                            <FormHelperText>
                              {String(formik.errors[field.id])}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                      <TextField
                        fullWidth
                        id={field.id}
                        name={field.id}
                        label={`${field.label} ${field.required ? "*" : ""}`}
                        value={formik.values[field.id] || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={
                          formik.touched[field.id] &&
                          Boolean(formik.errors[field.id])
                        }
                        helperText={
                          formik.touched[field.id] &&
                          typeof formik.errors[field.id] === "string"
                            ? String(formik.errors[field.id])
                            : undefined
                        }
                        sx={textFieldStyles}
                      />
                    </Grid>
                  );
                })}

                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(false)}
                      sx={{
                        px: 4,
                        py: 1.5,
                        borderColor: colors.BORDER,
                        color: colors.TEXT_PRIMARY,
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": { borderColor: colors.TEXT_PRIMARY }
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isUpdating}
                      onClick={async (e) => {
                        e.preventDefault();
                        const errors = await formik.validateForm();
                        const errorKeys = Object.keys(errors);
                        if (errorKeys.length > 0) {
                          formik.setTouched(
                            errorKeys.reduce((acc, key) => {
                              acc[key] = true;
                              return acc;
                            }, {} as Record<string, boolean>)
                          );
                          setTimeout(() => {
                            const firstErrorElement = document.getElementById(errorKeys[0]);
                            if (firstErrorElement) {
                              firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              firstErrorElement.focus();
                            }
                          }, 100);
                        } else {
                          formik.handleSubmit();
                        }
                      }}
                      sx={{
                        px: 5,
                        py: 1.5,
                        bgcolor: colors.PRIMARY,
                        color: "#fff",
                        fontWeight: "bold",
                        textTransform: "none",
                        boxShadow: "0 4px 14px 0 rgba(0,0,0,0.1)",
                        "&:hover": {
                          bgcolor: colors.PRIMARY,
                          opacity: 0.9,
                          boxShadow: "0 6px 20px 0 rgba(0,0,0,0.15)",
                        },
                      }}
                    >
                      {isUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Collapse>
      </Box>
    </Box>
  );
}
