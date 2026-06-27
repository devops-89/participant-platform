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
import * as Yup from "yup";
import { countries } from "@/utils/constant";
import { AuthControllers } from "../../api/authControllers";
import { contestControllers } from "../../api/contestControllers";
import { useGuestGuard } from "@/hooks/auth/useGuestGuard";
import { FORM_CONTROLLERS } from "../../api/formControllers";
import { ContestTemplateField } from "../../types/user";

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
          const selectedCountry = apiCountries.find(
            (c) => c.id === selectedCountryId,
          );
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
      }

      if (field.required) {
        if (field.type === "file_upload" || field.type === "file" || field.type === "image") {
          validator = validator.test(
            "fileRequired",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && value !== ""
          );
        } else {
          validator = validator.required(`${field.label} is required`);
        }
      }
      if (
        field.type === "email" ||
        field.label.toLowerCase().includes("email")
      ) {
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
              values[key] !== null &&
              values[key] !== ""
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
              values[key] !== null &&
              values[key] !== ""
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

        showSnackbar(
          res?.data?.message ||
            "Participant registered successfully. Please verify the OTP sent to your email.",
          "success",
        );

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
          <input type="email" name="fakeemailremembered" style={{ display: 'none' }} />
          <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} />

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
                      error={
                        formik.touched.countryId &&
                        Boolean(formik.errors.countryId)
                      }
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
                        <FormHelperText>
                          {formik.errors.countryId as string}
                        </FormHelperText>
                      )}
                    </FormControl>
                  </Grid>

                  {/* Contest Selector */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl
                      fullWidth
                      error={
                        formik.touched.contestId &&
                        Boolean(formik.errors.contestId)
                      }
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
                      {formik.touched.contestId && formik.errors.contestId && (
                        <FormHelperText>
                          {formik.errors.contestId as string}
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
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                        >
                          <InputLabel
                            id={`label-${field.id}`}
                            sx={{
                              color: colors.TEXT_SECONDARY,
                              "&.Mui-focused": { color: colors.PRIMARY },
                            }}
                          >
                            {field.label}
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
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                        <Box
                          sx={{
                            p: 1,
                            border: "1px dashed",
                            borderColor: colors.BORDER,
                            borderRadius: "8px",
                            textAlign: "center",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            minHeight: "56px",
                            height: "100%",
                            boxSizing: "border-box",
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: colors.TEXT_PRIMARY,
                              fontSize: "0.85rem",
                            }}
                          >
                            {field.label} {field.required && "*"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: "block",
                              mb: 0.5,
                              fontSize: "0.7rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {field.config?.allowedExtensions
                              ? `Allowed: ${field.config?.allowedExtensions}`
                              : "All files"}
                            {field.config?.maxSize
                              ? ` (Max: ${field.config?.maxSize}MB)`
                              : ""}
                          </Typography>
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            sx={{
                              alignSelf: "center",
                              borderColor: colors.BORDER,
                              color: colors.TEXT_PRIMARY,
                              "&:hover": { borderColor: colors.PRIMARY },
                              py: 0.25,
                              px: 1,
                              fontSize: "0.75rem",
                              textTransform: "none",
                            }}
                          >
                            Upload File
                            <input
                              type="file"
                              hidden
                              accept={
                                field.config?.allowedExtensions || undefined
                              }
                              onChange={(e) => {
                                if (
                                  e.target.files &&
                                  e.target.files.length > 0
                                ) {
                                  formik.setFieldValue(
                                    field.id,
                                    e.target.files[0],
                                  );
                                }
                              }}
                            />
                          </Button>
                          {formik.values[field.id] && (
                            <Box sx={{ display: "flex", alignItems: "center", mt: 1, gap: 1 }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colors.TEXT_PRIMARY,
                                }}
                              >
                                Selected:{" "}
                                {(formik.values[field.id] as unknown as File)
                                  .name || "File attached"}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => formik.setFieldValue(field.id, null)}
                                sx={{ color: "error.main", p: 0.5 }}
                              >
                                <Close fontSize="small" />
                              </IconButton>
                            </Box>
                          )}
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText
                                error
                                sx={{ textAlign: "center", mt: 1 }}
                              >
                                {formik.errors[field.id] as string}
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
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                        >
                          <FormLabel
                            component="legend"
                            sx={{
                              color: colors.TEXT_SECONDARY,
                              "&.Mui-focused": { color: colors.PRIMARY },
                            }}
                          >
                            {field.label}
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
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                        <MuiTelInput
                          fullWidth
                          id={field.id}
                          name={field.id}
                          label={field.label}
                          defaultCountry={
                            (field.config?.defaultCountry as any) || "IN"
                          }
                          onlyCountries={
                            (field.config?.onlyCountries as any) || undefined
                          }
                          value={formik.values[field.id] || ""}
                          onChange={(value) =>
                            formik.setFieldValue(field.id, value)
                          }
                          onBlur={() => formik.setFieldTouched(field.id, true)}
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                          helperText={
                            ((formik.touched[field.id] &&
                              formik.errors[field.id]) as string) ||
                            field.helperText
                          }
                          sx={textFieldStyles}
                        />
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
                                  color: colors.PRIMARY,
                                  "&.Mui-checked": { color: colors.PRIMARY },
                                }}
                              />
                            }
                            label={field.label}
                          />
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
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
                            label={field.label}
                          />
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: colors.TEXT_SECONDARY, mb: 1 }}
                          >
                            {field.label}
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
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                          error={
                            formik.touched[field.id] &&
                            Boolean(formik.errors[field.id])
                          }
                          sx={{ height: "100%", justifyContent: "center" }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: colors.TEXT_SECONDARY, mb: 1 }}
                          >
                            {field.label}
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
                          {formik.touched[field.id] &&
                            formik.errors[field.id] && (
                              <FormHelperText>
                                {formik.errors[field.id] as string}
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
                              variant="outlined"
                              error={
                                formik.touched[field.id] &&
                                Boolean(formik.errors[field.id])
                              }
                              helperText={
                                ((formik.touched[field.id] &&
                                  formik.errors[field.id]) as string) ||
                                field.helperText
                              }
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
                            disablePast={field.config?.disablePast}
                            disableFuture={field.config?.disableFuture}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error:
                                  formik.touched[field.id] &&
                                  Boolean(formik.errors[field.id]),
                                helperText:
                                  ((formik.touched[field.id] &&
                                    formik.errors[field.id]) as string) ||
                                  field.helperText,
                                sx: textFieldStyles,
                              },
                            }}
                          />
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
                        placeholder={field.placeholder}
                        type={
                          isPassword
                            ? showPassword
                              ? "text"
                              : "password"
                            : field.type || "text"
                        }
                        variant="outlined"
                        autoComplete="new-password"
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
                    sx={{
                      py: 1.5,
                      width: { xs: "100%", sm: "200px" },
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
