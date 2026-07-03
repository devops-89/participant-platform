"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { Visibility, VisibilityOff, Close } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Rating,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import * as Yup from "yup";
import { countries } from "@/utils/constant";
import { AuthControllers } from "../../api/authControllers";
import { contestControllers } from "../../api/contestControllers";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { FORM_CONTROLLERS } from "../../api/formControllers";
import { ContestTemplateField } from "../../types/user";
import { FilePreview } from "../widgets/FilePreview";

import { useSnackbar } from "@/context/SnackbarContext";

export default function Signup() {
  const { colors, mode } = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const { isChecking } = useGuestGuard();

  const [contests, setContests] = useState<any[]>([]);
  const [apiCountries, setApiCountries] = useState<any[]>([]);
  const [templateFields, setTemplateFields] = useState<ContestTemplateField[]>(
    [],
  );

  const [isLoadingContests, setIsLoadingContests] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState<
    Record<string, boolean>
  >({});

  const [selectedContestId, setSelectedContestId] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("IN");

  const getFieldError = (fieldId: string) => {
    const error = formik.errors[fieldId];
    if (!error) return null;
    
    const isTouched = formik.touched[fieldId];
    const val = formik.values[fieldId];
    
    // For MuiTelInput with forceCallingCode, the initial value might be just the country code (e.g., "+91")
    // We shouldn't treat this as "hasValue" unless it contains actual phone number digits after the country code.
    const isOnlyCountryCode = typeof val === "string" && /^\+\d{1,4}$/.test(val.trim());
    const hasValue = val !== undefined && val !== null && val !== "" && !isOnlyCountryCode;
    
    if (isTouched || hasValue) {
      return error as string;
    }
    return null;
  };

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
      const selectedCountry = apiCountries.find(
        (c) => c.id === selectedCountryId,
      );
      if (selectedCountry) {
        const matched = countries.find(
          (c) => c.label.toLowerCase() === selectedCountry.name?.toLowerCase()
        );
        if (matched) {
          setSelectedCountryCode(matched.code);
        }
      }

      const fetchContestsByCountry = async () => {
        setIsLoadingContests(true);
        try {
          const countryQuery = selectedCountry ? selectedCountry.name : "";

          const contestResponse =
            await contestControllers.getContest(countryQuery);
          const contestData =
            contestResponse?.data?.data?.docs ||
            contestResponse?.data?.docs ||
            contestResponse?.data ||
            contestResponse ||
            [];
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
      let validator: any = Yup.string();
      
      if (field.type === "telInput") {
        validator = validator.test(
          "isValidTel",
          "Invalid phone number",
          (value: any) => {
            if (!value) return true;
            return matchIsValidTel(value);
          }
        );
      }
      
      if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
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
      }

      const isPassword = field.type === "password" || field.label.toLowerCase().includes("password");

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

      const lowercaseLabel = field.label.toLowerCase();

      // Name fields validation: allow only alphabets and spaces
      if (
        lowercaseLabel.includes("name") ||
        lowercaseLabel.includes("first name") ||
        lowercaseLabel.includes("last name")
      ) {
        validator = validator.matches(
          /^[A-Za-z\s]+$/,
          "Only alphabetic characters and spaces are allowed"
        );
      }

      // Innovation title validation
      if (lowercaseLabel === "innovation title") {
        validator = validator.matches(
          /^[A-Za-z\s]+$/,
          "Only alphabetic characters and spaces are allowed"
        );
      }

      // Province/State/City validation
      if (
        lowercaseLabel.includes("province") ||
        lowercaseLabel.includes("state") ||
        lowercaseLabel.includes("city")
      ) {
        validator = validator.matches(
          /^[A-Za-z\s'-]+$/,
          "Only alphabetic characters are allowed"
        );
      }

      // Zip Code validation
      if (
        lowercaseLabel.includes("zip") ||
        lowercaseLabel.includes("postal") ||
        lowercaseLabel.includes("pin code") ||
        lowercaseLabel.includes("pincode")
      ) {
        validator = validator
          .matches(/^[0-9]+$/, "Only digits are allowed")
          .min(3, "Zip Code is too short")
          .max(10, "Zip Code is too long");
      }

      // Date of Birth validation
      if (
        field.type === "datePicker" ||
        lowercaseLabel.includes("date of birth") ||
        lowercaseLabel.includes("birth") ||
        lowercaseLabel.includes("dob")
      ) {
        validator = Yup.mixed()
          .test("isValidDate", "Invalid date format", (value: any) => {
            if (!value) return !field.required;
            return dayjs(value).isValid();
          });

        // For Date of birth, we usually disable future dates by default.
        if (lowercaseLabel.includes("dob") || lowercaseLabel.includes("date of birth") || lowercaseLabel.includes("birth") || field.config?.disableFuture) {
          validator = validator.test("noFutureDate", "Date cannot be in the future", (value: any) => {
            if (!value) return true;
            return dayjs(value).isBefore(dayjs().endOf('day'));
          });
        }

        if (lowercaseLabel.includes("birth")) {
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

      if (field.required) {
        if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
          validator = validator.test(
            "fileRequired",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && value !== ""
          );
        } else if (field.type === "datePicker") {
          validator = validator.test(
            "dateRequired",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && value !== ""
          );
        } else if (
          field.type === "checkbox" ||
          field.type === "switch" ||
          field.type === "boolean"
        ) {
          validator = validator.oneOf([true], `${field.label} is required`);
        } else {
          validator = validator.test(
            "required-trim",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : value !== false)
          );
        }
      }

      if (
        field.type === "email" ||
        lowercaseLabel.includes("email")
      ) {
        validator = validator.matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
          "Invalid email format"
        );
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

    let dialCode = "";
    if (selectedCountryId && apiCountries.length > 0) {
      const countryObj = apiCountries.find((c) => c.id === selectedCountryId);
      if (countryObj) {
        const matched = countries.find(
          (c) => c.label.toLowerCase() === countryObj.name?.toLowerCase()
        );
        if (matched) {
          dialCode = `+${matched.phone}`;
        }
      }
    }

    templateFields.forEach((field) => {
      if (
        field.type === "telInput" ||
        field.type === "phone" ||
        field.type === "tel" ||
        field.type === "phone_number"
      ) {
        values[field.id] = dialCode || "";
      } else {
        values[field.id] = "";
      }
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

        const hasFiles = Object.values(values).some((v) => v instanceof File);
        let payload: any;

        if (hasFiles) {
          payload = new FormData();
          payload.append("contestId", values.contestId);
          payload.append("countryId", values.countryId);

          Object.keys(values).forEach((key) => {
            if (
              key !== "contestId" &&
              key !== "countryId" &&
              values[key] !== undefined &&
              values[key] !== null
            ) {
              payload.append(`formData[${key}]`, values[key]);
            }
          });
        } else {
          const formData: Record<string, any> = {};

          Object.keys(values).forEach((key) => {
            if (
              key !== "contestId" &&
              key !== "countryId" &&
              values[key] !== undefined &&
              values[key] !== null
            ) {
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

        showSnackbar("Please verify your OTP.", "success");

        let emailFallback = "";
        templateFields.forEach((field) => {
          if (field.type === "email" || field.label.toLowerCase().includes("email")) {
            const val = values[field.id];
            if (val) emailFallback = String(val);
          }
        });

        const registeredEmail =
          res?.data?.data?.email || res?.data?.email || emailFallback;
        setTimeout(() => {
          setIsLoading(false);
          router.push(
            `/verify-otp?email=${encodeURIComponent(registeredEmail)}`,
          );
        }, 2000);
      } catch (err: any) {
        setIsLoading(false);
        showSnackbar(
          err?.response?.data?.message || err?.message || "Signup failed",
          "error",
        );
      }
    },
  });

  useEffect(() => {
    if (selectedCountryId && apiCountries.length > 0) {
      const countryObj = apiCountries.find((c) => c.id === selectedCountryId);
      if (countryObj) {
        const matched = countries.find(
          (c) => c.label.toLowerCase() === countryObj.name?.toLowerCase()
        );
        if (matched) {
          const newDialCode = `+${matched.phone}`;
          templateFields.forEach((field) => {
            if (
              field.type === "telInput" ||
              field.type === "phone" ||
              field.type === "tel" ||
              field.type === "phone_number"
            ) {
              const currentValue = formik.values[field.id];
              // Only update if it's empty or just a country code (so we don't wipe user typed numbers when they just change country... actually wait, changing country should change the prefix)
              if (!currentValue || /^\+\d{1,4}$/.test(currentValue)) {
                formik.setFieldValue(field.id, newDialCode);
              }
            }
          });
        }
      }
    }
  }, [selectedCountryId, apiCountries, templateFields]);

  // Handle contest selection change to fetch dynamic fields
  useEffect(() => {
    const contestId = formik.values.contestId;
    if (contestId) {
      const fetchTemplate = async () => {
        setIsLoadingTemplate(true);
        try {
          const res = await contestControllers.getContestDetails(contestId);
          let fields =
            res?.data?.userLevelTemplate?.schema?.fields ||
            res?.userLevelTemplate?.schema?.fields;

          if (!fields || fields.length === 0) {
            // Fallback: If template schema is not populated, fetch it using the template ID
            const templateId =
              res?.data?.user_level_template_id || res?.user_level_template_id;
            if (templateId) {
              const templateRes =
                await FORM_CONTROLLERS.getTemplateById(templateId);
              fields =
                templateRes?.data?.data?.schema?.fields ||
                templateRes?.data?.schema?.fields ||
                [];
            } else {
              fields = [];
            }
          }

          setTemplateFields(fields);
        } catch (error) {
          console.error("Failed to fetch contest template", error);
          showSnackbar(
            "Failed to load registration fields for the selected contest.",
            "error",
          );
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

  if (isChecking) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        boxSizing: "border-box",
        background: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`,
        pt: { xs: 6, md: 8 },
        pb: 4,
        px: 2,
        transition: "background 0.3s ease",
      }}
    >
      <Container maxWidth="md">
        <form onSubmit={formik.handleSubmit} autoComplete="off">
          {/* Dummy fields to intercept browser autofill */}
          <input type="text" name="fakeusernameremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="username" />
          <input type="password" name="fakepasswordremembered" style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="current-password" />

          <Paper
            elevation={0}
            sx={{
              padding: { xs: 3, md: 4 },
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

            <Grid container spacing={3}>
              {!(formik.values.countryId && formik.values.contestId) ? (
                <>
                  {/* Country Selector */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl
                      fullWidth
                      error={Boolean(getFieldError("countryId"))}
                    >
                      <InputLabel
                        id="country-select-label"
                        sx={{
                          color: colors.TEXT_SECONDARY,
                          "&.Mui-focused": { color: colors.PRIMARY },
                        }}
                      >
                        Country
                      </InputLabel>
                      <Select
                        labelId="country-select-label"
                        id="countryId"
                        name="countryId"
                        value={formik.values.countryId}
                        onChange={(e) => {
                          formik.handleChange(e);
                          const newCountryId = e.target.value;
                          setSelectedCountryId(newCountryId);

                          const countryObj = apiCountries.find((c) => c.id === newCountryId);
                          if (countryObj) {
                            const matched = countries.find(
                              (c) => c.label.toLowerCase() === countryObj.name?.toLowerCase()
                            );
                            if (matched) {
                              setSelectedCountryCode(matched.code);
                              const dialCode = `+${matched.phone}`;
                              // Find all telInput fields in templateFields and set their value
                              templateFields.forEach((field) => {
                                if (
                                  field.type === "telInput" ||
                                  field.type === "phone" ||
                                  field.type === "tel" ||
                                  field.type === "phone_number"
                                ) {
                                  formik.setFieldValue(field.id, dialCode);
                                }
                              });
                            }
                          }
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
                      {getFieldError("countryId") && (
                        <FormHelperText>
                          {getFieldError("countryId")}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Contest Selector */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl
                      fullWidth
                      error={Boolean(getFieldError("contestId"))}
                    >
                      <InputLabel
                        id="contest-select-label"
                        sx={{
                          color: colors.TEXT_SECONDARY,
                          "&.Mui-focused": { color: colors.PRIMARY },
                        }}
                      >
                        Contest
                      </InputLabel>
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
                      {getFieldError("contestId") && (
                        <FormHelperText>
                          {getFieldError("contestId")}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>
                </>
              ) : (
                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 2,
                      alignItems: "center",
                      mb: 2,
                      p: 2,
                      bgcolor: "rgba(255,255,255,0.5)",
                      borderRadius: 2,
                      border: `1px solid ${colors.BORDER}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: colors.TEXT_PRIMARY }}
                    >
                      <strong>Country:</strong>{" "}
                      {
                        apiCountries.find(
                          (c) => c.id === formik.values.countryId,
                        )?.name
                      }
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.TEXT_PRIMARY }}
                    >
                      <strong>Contest:</strong>{" "}
                      {contests.find(
                        (c: any) => c.id === formik.values.contestId,
                      )?.name ||
                        contests.find(
                          (c: any) => c.id === formik.values.contestId,
                        )?.title}
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        formik.setFieldValue("contestId", "");
                        setSelectedContestId("");
                      }}
                      sx={{
                        ml: "auto",
                        borderColor: colors.PRIMARY,
                        color: colors.PRIMARY,
                        "&:hover": {
                          borderColor: colors.PRIMARY,
                          bgcolor: "rgba(0,0,0,0.04)",
                        },
                      }}
                    >
                      Change
                    </Button>
                  </Box>
                </Grid>
              )}

              {isLoadingTemplate && (
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: colors.PRIMARY, textAlign: "center" }}
                  >
                    Loading registration fields...
                  </Typography>
                </Grid>
              )}

              {/* Dynamic Fields */}
              {!isLoadingTemplate &&
                templateFields.map((field) => {
                  const isPassword =
                    field.type === "password" ||
                    field.label.toLowerCase().includes("password");
                  const showPassword = showPasswordMap[field.id] || false;

                  if (
                    field.type === "select" ||
                    field.type === "dropdown" ||
                    field.type === "countrySelector"
                  ) {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          fullWidth
                          error={Boolean(getFieldError(field.id))}
                        >
                          <InputLabel
                            id={`label-${field.id}`}
                            sx={{
                              color: colors.TEXT_SECONDARY,
                              "&.Mui-focused": { color: colors.PRIMARY },
                            }}
                          >
                            {field.label}{field.required && " *"}
                          </InputLabel>
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
                            {field.type === "countrySelector" || field.label?.toLowerCase().includes("country")
                              ? apiCountries.map((country) => (
                                  <MenuItem
                                    key={country.id}
                                    value={country.name}
                                  >
                                    {country.name}
                                  </MenuItem>
                                ))
                              : (Array.isArray(field.options)
                                  ? field.options
                                  : []
                                ).map((opt: any, idx: number) => (
                                  <MenuItem key={idx} value={opt?.value || opt}>
                                    {opt?.label || opt}
                                  </MenuItem>
                                ))}
                          </Select>
                          {getFieldError(field.id) && (
                              <FormHelperText>
                                {getFieldError(field.id)}
                              </FormHelperText>
                            )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (
                    field.type === "file_upload" ||
                    field.type === "file" ||
                    field.type === "image"
                  ) {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <Box sx={{ p: 1.5, border: "1px dashed", borderColor: "divider", borderRadius: "10px", position: "relative", width: "100%", boxSizing: "border-box" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "left", color: colors.TEXT_PRIMARY }}>
                              {field.label}{field.required && " *"}
                            </Typography>
                            
                            {!formik.values[field.id] && (
                              <Button variant="outlined" component="label" size="small" sx={{ whiteSpace: 'nowrap' }}>
                                Upload File
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
                            <Box sx={{ mt: 2, position: "relative", display: "flex", justifyContent: "flex-start", width: "100%" }}>
                              <FilePreview 
                                fileVal={formik.values[field.id]} 
                                label={field.label} 
                                onClear={() => formik.setFieldValue(field.id, null)} 
                              />
                            </Box>
                          )}
                          {getFieldError(field.id) && (
                            <FormHelperText error sx={{ mx: 2, mt: 0.5 }}>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </Box>
                      </Grid>
                    );
                  }

                  if (field.type === "radio" || field.type === "boolean") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          component="fieldset"
                          error={Boolean(getFieldError(field.id))}
                        >
                          <FormLabel
                            component="legend"
                            sx={{
                              color: colors.TEXT_SECONDARY,
                              "&.Mui-focused": { color: colors.PRIMARY },
                            }}
                          >
                            {field.label}{field.required && " *"}
                          </FormLabel>
                          <RadioGroup
                            row
                            name={field.id}
                            value={String(formik.values[field.id] || "")}
                            onChange={formik.handleChange}
                          >
                            {Array.isArray(field.options) &&
                            field.options.length > 0 ? (
                              field.options.map((opt: any, idx: number) => (
                                <FormControlLabel
                                  key={idx}
                                  value={String(opt?.value || opt)}
                                  control={
                                    <Radio
                                      sx={{
                                        color: colors.PRIMARY,
                                        "&.Mui-checked": {
                                          color: colors.PRIMARY,
                                        },
                                      }}
                                    />
                                  }
                                  label={opt?.label || opt}
                                />
                              ))
                            ) : (
                              <>
                                <FormControlLabel
                                  value="Yes"
                                  control={
                                    <Radio
                                      sx={{
                                        color: colors.PRIMARY,
                                        "&.Mui-checked": {
                                          color: colors.PRIMARY,
                                        },
                                      }}
                                    />
                                  }
                                  label="Yes"
                                />
                                <FormControlLabel
                                  value="No"
                                  control={
                                    <Radio
                                      sx={{
                                        color: colors.PRIMARY,
                                        "&.Mui-checked": {
                                          color: colors.PRIMARY,
                                        },
                                      }}
                                    />
                                  }
                                  label="No"
                                />
                              </>
                            )}
                          </RadioGroup>
                          {getFieldError(field.id) && (
                            <FormHelperText>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (
                    field.type === "telInput" ||
                    field.type === "phone" ||
                    field.type === "tel" ||
                    field.type === "phone_number"
                  ) {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        {(() => {
                          const phoneVal = formik.values[field.id] || "";
                          const parsed = parsePhoneNumberFromString(phoneVal);
                          const countryCode = parsed?.country || selectedCountryCode || "IN";
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
                              label={field.label}
                              required={field.required}
                              defaultCountry={(field.config?.defaultCountry || selectedCountryCode) as any}
                              onlyCountries={field.config?.onlyCountries || undefined}
                              forceCallingCode
                              value={formik.values[field.id] || ""}
                              onChange={(value) => {
                                formik.setFieldValue(field.id, value);
                                formik.setFieldTouched(field.id, true, false);
                              }}
                              onBlur={() => formik.setFieldTouched(field.id, true)}
                              error={Boolean(getFieldError(field.id))}
                              helperText={getFieldError(field.id) || field.helperText}
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
                          error={Boolean(getFieldError(field.id))}
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
                                  color: colors.PRIMARY,
                                  "&.Mui-checked": { color: colors.PRIMARY },
                                }}
                              />
                            }
                            label={`${field.label}${field.required ? " *" : ""}`}
                          />
                          {getFieldError(field.id) && (
                            <FormHelperText>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "switch") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          error={Boolean(getFieldError(field.id))}
                          sx={{ height: "100%", justifyContent: "center" }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                id={field.id}
                                name={field.id}
                                checked={Boolean(formik.values[field.id])}
                                onChange={formik.handleChange}
                                sx={{
                                  "& .MuiSwitch-switchBase.Mui-checked": {
                                    color: colors.PRIMARY,
                                  },
                                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                                    { backgroundColor: colors.PRIMARY },
                                }}
                              />
                            }
                            label={`${field.label}${field.required ? " *" : ""}`}
                          />
                          {getFieldError(field.id) && (
                            <FormHelperText>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "slider") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          fullWidth
                          error={Boolean(getFieldError(field.id))}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: colors.TEXT_SECONDARY, mb: 1 }}
                          >
                            {field.label}{field.required && " *"}
                          </Typography>
                          <Slider
                            id={field.id}
                            name={field.id}
                            value={
                              Number(formik.values[field.id]) ||
                              field.config?.min ||
                              0
                            }
                            onChange={(e, newValue) =>
                              formik.setFieldValue(field.id, newValue)
                            }
                            min={field.config?.min || 0}
                            max={field.config?.max || 100}
                            valueLabelDisplay="auto"
                            sx={{
                              color: colors.PRIMARY,
                              width: "90%",
                              mx: "auto",
                            }}
                          />
                          {getFieldError(field.id) && (
                            <FormHelperText>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "rating") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <FormControl
                          error={Boolean(getFieldError(field.id))}
                          sx={{ height: "100%", justifyContent: "center" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: colors.TEXT_SECONDARY, mb: 1 }}
                          >
                            {field.label}{field.required && " *"}
                          </Typography>
                          <Rating
                            id={field.id}
                            name={field.id}
                            value={Number(formik.values[field.id]) || 0}
                            onChange={(e, newValue) =>
                              formik.setFieldValue(field.id, newValue)
                            }
                            max={field.config?.max || 5}
                            sx={{ color: colors.PRIMARY }}
                          />
                          {getFieldError(field.id) && (
                            <FormHelperText>
                              {getFieldError(field.id)}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>
                    );
                  }

                  if (field.type === "autocomplete") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <Autocomplete
                          id={field.id}
                          options={
                            Array.isArray(field.options) ? field.options : []
                          }
                          value={formik.values[field.id] || null}
                          onChange={(e, newValue) =>
                            formik.setFieldValue(field.id, newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={field.label}
                              required={field.required}
                              variant="outlined"
                              error={Boolean(getFieldError(field.id))}
                              helperText={getFieldError(field.id) || field.helperText}
                              sx={textFieldStyles}
                            />
                          )}
                          fullWidth
                        />
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
                                label={field.label}
                                value={
                                  formik.values[field.id]
                                    ? dayjs(formik.values[field.id])
                                    : null
                                }
                                onChange={(newValue: any) => {
                                  if (newValue && typeof newValue.isValid === "function" && newValue.isValid()) {
                                    formik.setFieldValue(field.id, newValue.toISOString());
                                  } else {
                                    formik.setFieldValue(field.id, "");
                                  }
                                }}
                                disablePast={isBirthDate ? false : field.config?.disablePast}
                                disableFuture={isBirthDate ? true : field.config?.disableFuture}
                                minDate={isBirthDate ? dayjs().subtract(25, 'year') : undefined}
                                maxDate={isBirthDate ? dayjs().subtract(10, 'year') : undefined}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    onBlur: () => formik.setFieldTouched(field.id, true),
                                    error: Boolean(getFieldError(field.id)),
                                    helperText: getFieldError(field.id) || field.helperText,
                                    required: field.required,
                                    sx: textFieldStyles,
                                  },
                                }}
                              />
                            );
                          })()}
                        </LocalizationProvider>
                      </Grid>
                    );
                  }

                  if (field.type === "numberField" || field.type === "number") {
                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                        <TextField
                          fullWidth
                          id={field.id}
                          name={field.id}
                          label={field.label}
                          required={field.required}
                          placeholder={field.placeholder}
                          type="number"
                          variant="outlined"
                          sx={textFieldStyles}
                          value={formik.values[field.id] || ""}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                          helperText={
                            ((formik.touched[field.id] &&
                              formik.errors[field.id]) as string) ||
                            field.helperText
                          }
                        />
                      </Grid>
                    );
                  }

                  return (
                    <Grid size={{ xs: 12, md: 6 }} key={field.id}>
                      <TextField
                        fullWidth
                        id={field.id}
                        name={field.id}
                        label={field.label}
                        required={field.required}
                        placeholder={field.placeholder}
                        type={
                          isPassword
                            ? showPassword
                              ? "text"
                              : "password"
                            : field.type || "text"
                        }
                        variant="outlined"
                        autoComplete={isPassword ? "new-password" : "off"}
                        sx={textFieldStyles}
                        value={formik.values[field.id] || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={Boolean(getFieldError(field.id))}
                        helperText={getFieldError(field.id) || field.helperText}
                        slotProps={
                          isPassword
                            ? {
                                input: {
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() =>
                                          togglePasswordVisibility(field.id)
                                        }
                                        edge="end"
                                        sx={{ color: colors.TEXT_SECONDARY }}
                                      >
                                        {showPassword ? (
                                          <VisibilityOff />
                                        ) : (
                                          <Visibility />
                                        )}
                                      </IconButton>
                                    </InputAdornment>
                                  ),
                                },
                              }
                            : undefined
                        }
                      />
                    </Grid>
                  );
                })}

              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    mt: 1,
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
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={
                      isLoading ||
                      isLoadingContests ||
                      isLoadingTemplate ||
                      !formik.values.contestId
                    }
                    onClick={() => {
                      // Touch all form fields to display validation errors immediately
                      const touchedFields: Record<string, boolean> = {
                        contestId: true,
                        countryId: true,
                      };
                      templateFields.forEach(f => {
                        touchedFields[f.id] = true;
                      });
                      formik.setTouched(touchedFields);

                      // Scroll to the first field with an error
                      formik.validateForm().then((errors) => {
                        const errorKeys = Object.keys(errors);
                        if (errorKeys.length > 0) {
                          // Try to find the element by ID
                          const firstErrorElement = document.getElementById(errorKeys[0]);
                          if (firstErrorElement) {
                            firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            firstErrorElement.focus();
                          }
                        }
                      });
                    }}
                    fullWidth
                    sx={{
                      py: 1.5,
                      width: "100%",
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
              </Grid>
            </Grid>
          </Paper>
        </form>
      </Container>
    </Box>
  );
}
