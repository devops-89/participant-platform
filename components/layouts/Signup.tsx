"use client";

import { useAppTheme } from "@/context/ThemeContext";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { countries } from "@/utils/constant";
import { Visibility, VisibilityOff } from "@mui/icons-material";
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
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { getExampleNumber, parsePhoneNumberFromString } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { AuthControllers } from "../../api/authControllers";
import { contestControllers } from "../../api/contestControllers";
import { FORM_CONTROLLERS } from "../../api/formControllers";
import { ContestTemplateField } from "../../types/user";
import { FilePreview } from "../widgets/FilePreview";

import { useSnackbar } from "@/context/SnackbarContext";

export default function Signup() {
  const { colors} = useAppTheme();
  const router = useRouter();
  const { showSnackbar } = useSnackbar();

  const { isChecking } = useGuestGuard();

  const [contests, setContests] = useState<{ id?: string; name?: string; _id?: string; title?: string }[]>([]);
  const [apiCountries, setApiCountries] = useState<{ id?: string; name?: string }[]>([]);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // eslint-disable-next-line
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
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryId, apiCountries]);

  const buildValidationSchema = () => {
    const shape: Record<string, import("yup").AnySchema> = {
      contestId: Yup.string().required("Please select a contest"),
      countryId: Yup.string().required("Please select a country"),
    };

    templateFields.forEach((field) => {
      let validator: import("yup").AnySchema = Yup.string();
      
      if (field.type === "telInput") {
        validator = validator.test(
          "isValidTel",
          "Invalid phone number",
          (value: unknown) => {
            if (!value) return true;
            return matchIsValidTel(value as string);
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
            (value: unknown) => {
              if (!value) return true;
              if (value instanceof File) return value.size <= maxSize;
              return true;
            }
          );
        }

        if (field.config?.allowedExtensions) {
          const allowed = (typeof field.config.allowedExtensions === 'string' 
            ? field.config.allowedExtensions.split(",").map((e: string) => e.trim().toLowerCase()) 
            : field.config.allowedExtensions || []) as string[];
          validator = validator.test(
            "fileType",
            `Unsupported file type (Allowed: ${allowed.join(", ")})`,
            (value: unknown) => {
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
        if (field.label.toLowerCase().includes("confirm")) {
          const originalPasswordField = templateFields.find(
            (f) => (f.type === "password" || f.label.toLowerCase().includes("password")) && !f.label.toLowerCase().includes("confirm")
          );
          if (originalPasswordField) {
            validator = (validator as import("yup").StringSchema).oneOf(
              [Yup.ref(originalPasswordField.id)],
              `${field.label} must match ${originalPasswordField.label}`
            );
          }
        } else {
          validator = (validator as import("yup").StringSchema)
            .min(8, "Password must be at least 8 characters")
            .matches(/[A-Z]/, "Password must include at least one uppercase letter")
            .matches(/[0-9]/, "Password must include at least one number")
            .matches(
              /[!@#$%^&*(),.?":{}|<>]/,
              "Password must include at least one special character"
            );
        }
      }

      const lowercaseLabel = field.label.toLowerCase();

      // Name fields validation: allow only alphabets and spaces
      if (
        lowercaseLabel.includes("name") ||
        lowercaseLabel.includes("first name") ||
        lowercaseLabel.includes("last name")
      ) {
        validator = (validator as import("yup").StringSchema).matches(
          /^[A-Za-z\s]+$/,
          "Only alphabetic characters and spaces are allowed"
        );
      }

      // Innovation title validation
      if (lowercaseLabel === "innovation title") {
        validator = (validator as import("yup").StringSchema).matches(
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
        validator = (validator as import("yup").StringSchema).matches(
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
        validator = (validator as import("yup").StringSchema)
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
          .test("isValidDate", "Invalid date format", (value: unknown) => {
            if (!value) return !field.required;
            return dayjs(value as string | Date).isValid();
          });

        // For Date of birth, we usually disable future dates by default.
        if (lowercaseLabel.includes("dob") || lowercaseLabel.includes("date of birth") || lowercaseLabel.includes("birth") || field.config?.disableFuture) {
          validator = validator.test("noFutureDate", "Date cannot be in the future", (value: unknown) => {
            if (!value) return true;
            return dayjs(value as string | Date).isBefore(dayjs().endOf('day'));
          });
        }

        if (lowercaseLabel.includes("birth")) {
           validator = validator.test('age-range', 'Age must be between 10 and 25 years', (val: unknown) => {
              if (!val) return true;
              const diff = dayjs().diff(dayjs(val as string | Date), 'year');
              return diff >= 10 && diff <= 25;
           });
        }

        if (field.config?.disablePast) {
          validator = validator.test("noPastDate", "Date cannot be in the past", (value: unknown) => {
            if (!value) return true;
            return dayjs(value as string | Date).isAfter(dayjs().startOf('day'));
          });
        }
      }

      if (field.required) {
        if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
          validator = validator.test(
            "fileRequired",
            `${field.label} is required`,
            (value: unknown) => value !== null && value !== undefined && value !== ""
          );
        } else if (field.type === "datePicker") {
          validator = validator.test(
            "dateRequired",
            `${field.label} is required`,
            (value: unknown) => value !== null && value !== undefined && value !== ""
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
            (value: unknown) => value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : value !== false)
          );
        }
      }

      if (
        field.type === "email" ||
        lowercaseLabel.includes("email")
      ) {
        validator = (validator as import("yup").StringSchema).matches(
          /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
          "Invalid email format"
        );
      }
      shape[field.id] = validator;
    });

    return Yup.object().shape(shape);
  };

  const getInitialValues = () => {
    const values: Record<string, unknown> = {
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
        if (field.config?.defaultCountry) {
          const matched = countries.find((c) => c.code === field.config?.defaultCountry);
          values[field.id] = matched ? `+${matched.phone}` : (dialCode || "");
        } else {
          values[field.id] = dialCode || "";
        }
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
        let payload: import("@/types/user").ParticipantSignupPayload | FormData;

        if (hasFiles) {
          const formDataPayload = new FormData();
          formDataPayload.append("contestId", values.contestId as string);
          formDataPayload.append("countryId", values.countryId as string);

          Object.keys(values).forEach((key) => {
            if (
              key !== "contestId" &&
              key !== "countryId" &&
              values[key] !== undefined &&
              values[key] !== null
            ) {
              formDataPayload.append(`formData[${key}]`, values[key] as string | Blob);
            }
          });
          payload = formDataPayload;
        } else {
          const formData: import("@/types/user").DynamicFormData = {};

          Object.keys(values).forEach((key) => {
            if (
              key !== "contestId" &&
              key !== "countryId" &&
              values[key] !== undefined &&
              values[key] !== null
            ) {
              formData[key] = values[key] as string | number | boolean | string[] | File | null;
            }
          });

          payload = {
            contestId: String(values.contestId),
            countryId: String(values.countryId),
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
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }, message?: string };
        setIsLoading(false);
        showSnackbar(
          error?.response?.data?.message || error?.message || "Signup failed",
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
              const currentValue = String(formik.values[field.id] || "");
              // Only update if it's empty or just a country code (so we don't wipe user typed numbers when they just change country... actually wait, changing country should change the prefix)
              if (!currentValue || /^\+\d{1,4}$/.test(currentValue)) {
                if (field.config?.defaultCountry) {
                  const fieldMatched = countries.find((c) => c.code.toUpperCase() === String(field.config?.defaultCountry || "").toUpperCase());
                  if (fieldMatched) {
                    formik.setFieldValue(field.id, `+${fieldMatched.phone}`);
                  } else {
                    formik.setFieldValue(field.id, newDialCode);
                  }
                } else {
                  formik.setFieldValue(field.id, newDialCode);
                }
              }
            }
          });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountryId, apiCountries, templateFields]);

  // Handle contest selection change to fetch dynamic fields
  useEffect(() => {
    const contestId = formik.values.contestId;
    if (contestId) {
      const fetchTemplate = async () => {
        setIsLoadingTemplate(true);
        try {
          const res = await contestControllers.getContestDetails(String(contestId));
          let fields =
            res?.data?.userLevelTemplate?.schema?.fields ||
            res?.userLevelTemplate?.schema?.fields;

          if (!fields || fields.length === 0) {
            // Fallback: If template schema is not populated, fetch it using the template ID
            const templateId =
              res?.data?.user_level_template_id || res?.user_level_template_id;
            if (templateId) {
              const templateRes =
                await FORM_CONTROLLERS.getTemplateById(String(templateId));
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
      // eslint-disable-next-line
      setTemplateFields([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                          const newCountryId = e.target.value as string;
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
                          setSelectedContestId(e.target.value as string);
                        }}
                        onBlur={formik.handleBlur}
                        label="Contest"
                        disabled={isLoadingContests}
                        sx={textFieldStyles}
                      >
                        {contests.map((contest: { id?: string; name?: string; _id?: string; title?: string }) => (
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
                        (c: { id?: string; name?: string; _id?: string; title?: string }) => c.id === formik.values.contestId,
                      )?.name ||
                        contests.find(
                          (c: { id?: string; name?: string; _id?: string; title?: string }) => c.id === formik.values.contestId,
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
                            value={String(formik.values[field.id] || "")}
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
                                ).map((opt: Record<string, unknown> | string, idx: number) => {
                                    const optVal = typeof opt === 'string' ? opt : String(opt?.value || "");
                                    const optLabel = typeof opt === 'string' ? opt : String(opt?.label || "");
                                    return (
                                      <MenuItem key={idx} value={optVal}>
                                        {optLabel}
                                      </MenuItem>
                                    );
                                  })
                            }
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
                            
                            {!formik.values[field.id] ? (
                              <Button variant="outlined" component="label" size="small" sx={{ whiteSpace: 'nowrap' }}>
                                Upload File
                                <input
                                  type="file"
                                  hidden
                                  accept={(field.config?.allowedExtensions as string) || undefined}
                                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      formik.setFieldValue(field.id, e.target.files[0]);
                                    }
                                  }}
                                />
                              </Button>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center" }}>
                                <FilePreview 
                                  fileVal={formik.values[field.id]} 
                                  label={field.label} 
                                  onClear={() => formik.setFieldValue(field.id, null)} 
                                />
                              </Box>
                            )}
                          </Box>
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
                              field.options.map((opt: Record<string, unknown> | string, idx: number) => {
                                const optVal = typeof opt === 'string' ? opt : String(opt?.value || "");
                                const optLabel = typeof opt === 'string' ? opt : String(opt?.label || "");
                                return (
                                  <FormControlLabel
                                    key={idx}
                                    value={optVal}
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
                                    label={optLabel}
                                  />
                                );
                              })
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
                          const phoneVal = String(formik.values[field.id] || "");
                          const parsed = parsePhoneNumberFromString(phoneVal);

                          return (
                            <MuiTelInput
                              onKeyDown={(e) => {
                                const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab", "Enter"];
                                if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey || e.altKey) {
                                  return;
                                }

                                const input = e.target as HTMLInputElement;
                                if (input && input.selectionStart !== input.selectionEnd) {
                                  return; // Allow replacing selected text
                                }

                                const oldParsed = parsePhoneNumberFromString(phoneVal);
                                if (oldParsed?.isValid()) {
                                  e.preventDefault();
                                  return;
                                }

                                const currentCountry = parsed?.country || selectedCountryCode || "IN";
                                const ex = getExampleNumber(currentCountry as import("libphonenumber-js").CountryCode, examples);
                                if (ex) {
                                  const maxDigits = ex.number.replace(/\D/g, "").length;
                                  const currentDigits = phoneVal.replace(/\D/g, "").length;
                                  if (currentDigits >= maxDigits) {
                                    e.preventDefault();
                                  }
                                } else if (phoneVal.replace(/\D/g, "").length >= 15) {
                                  e.preventDefault();
                                }
                              }}
                              fullWidth
                              id={field.id}
                              name={field.id}
                              label={field.label}
                              required={field.required}
                              defaultCountry={(() => {
                                const dc = (field.config?.defaultCountry || selectedCountryCode) as import("libphonenumber-js").CountryCode;
                                const oc = field.config?.onlyCountries as import("libphonenumber-js").CountryCode[];
                                if (oc && oc.length > 0 && !oc.includes(dc)) return oc[0];
                                return dc;
                              })()}
                              onlyCountries={(() => {
                                const oc = field.config?.onlyCountries as import("libphonenumber-js").CountryCode[];
                                const dc = (field.config?.defaultCountry || selectedCountryCode) as import("libphonenumber-js").CountryCode;
                                if (oc && oc.length > 0) {
                                  return Array.from(new Set([...oc, dc]));
                                }
                                return undefined;
                              })()}
                              value={String(formik.values[field.id] || "")}
                              sx={{
                                ...textFieldStyles,
                                 "& .MuiTelInput-Flag": {
                                  position: "relative",
                                  "& > *": {
                                    opacity: 0,
                                  },
                                  "&::after": {
                                     content: '""',
                                     position: "absolute",
                                     top: 0,
                                     left: 0,
                                     width: "100%",
                                     height: "100%",
                                     backgroundImage: `url(https://flagcdn.com/w20/${(() => {
                                        let dc = formik.values[`${field.id}_country`];
                                        if (!dc) {
                                          dc = (field.config?.defaultCountry || selectedCountryCode) as import("libphonenumber-js").CountryCode;
                                          const phoneVal = String(formik.values[field.id] || "");
                                          const callingCodeMatch = phoneVal.match(/^\+(\d{1,4})/);
                                          if (callingCodeMatch) {
                                            const cc = callingCodeMatch[1];
                                            const matchedCountries = countries.filter(c => c.phone === cc);
                                            if (matchedCountries.length > 0) {
                                              if (!matchedCountries.some(c => c.code === dc)) {
                                                const usMatch = matchedCountries.find(c => c.code === "US");
                                                dc = usMatch ? usMatch.code : matchedCountries[0].code;
                                              }
                                            }
                                          }
                                        }
                                        return String(dc).toLowerCase();
                                     })()}.png)`,
                                     backgroundSize: "cover",
                                     backgroundPosition: "center",
                                     backgroundRepeat: "no-repeat",
                                     pointerEvents: "none"
                                  }
                                }
                              }}
                              onChange={(value, info) => {
                                const currentCountry = info.countryCode || parsed?.country || selectedCountryCode || "IN";
                                const ex = getExampleNumber(currentCountry as import("libphonenumber-js").CountryCode, examples);
                                
                                const phoneVal = String(formik.values[field.id] || "");
                                const oldParsed = parsePhoneNumberFromString(phoneVal);
                                
                                if (oldParsed?.isValid() && value.length > phoneVal.length) {
                                  return; // Block typing more digits if it's already a perfectly valid number
                                }

                                if (ex) {
                                  const maxDigits = ex.number.replace(/\D/g, "").length;
                                  const currentDigits = value.replace(/\D/g, "").length;
                                  if (currentDigits > maxDigits) {
                                    return; // block typing more digits than the example number allows
                                  }
                                } else if (value.replace(/\D/g, "").length > 15) {
                                  return; // fallback max digits
                                }
                                
                                if (info.countryCode) formik.setFieldValue(`${field.id}_country`, info.countryCode);
                                formik.setFieldValue(field.id, value);
                                formik.setFieldTouched(field.id, true, false);
                              }}
                              onBlur={() => formik.setFieldTouched(field.id, true)}
                              error={Boolean(getFieldError(field.id))}
                              helperText={getFieldError(field.id) || field.helperText}
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
                              Number(formik.values[field.id]) || Number(field.config?.min || 0)
                            }
                            onChange={(e, newValue) =>
                              formik.setFieldValue(field.id, newValue)
                            }
                            min={Number(field.config?.min || 0)}
                            max={Number(field.config?.max || 100)}
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
                            max={Number(field.config?.max || 5)}
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
                          value={(formik.values[field.id] as string | null) || null}
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
                                    ? dayjs(formik.values[field.id] as string)
                                    : null
                                }
                                onChange={(newValue) => {
                                  if (newValue && typeof newValue.isValid === "function" && newValue.isValid()) {
                                    formik.setFieldValue(field.id, newValue.toISOString());
                                  } else {
                                    formik.setFieldValue(field.id, "");
                                  }
                                }}
                                disablePast={isBirthDate ? false : Boolean(field.config?.disablePast)}
                                disableFuture={isBirthDate ? true : Boolean(field.config?.disableFuture)}
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
                          value={String(formik.values[field.id] || "")}
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
                        value={String(formik.values[field.id] || "")}
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
