"use client";

import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Rating,
  Select,
  Slider,
  Switch,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { FilePreview } from "@/components/widgets/FilePreview";
import { useSnackbar } from "@/context/SnackbarContext";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { MuiTelInput, matchIsValidTel } from "mui-tel-input";
import { parsePhoneNumberFromString, getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import React, { useState, useMemo, useEffect } from "react";
import * as Yup from "yup";

import { countries } from "@/utils/constant";
import { FIELDS_TYPE } from "@/utils/enum";
import { montserrat } from "@/utils/fonts";

interface DynamicFormRendererProps {
  fields: any[];
  onSubmit: (values: any) => Promise<void>;
  submitLabel?: string;
  initialData?: any;
  onDraft?: (values: any) => Promise<void>;
  draftLabel?: string;
}

const DynamicFormRenderer: React.FC<DynamicFormRendererProps> = ({
  fields,
  onSubmit,
  submitLabel = "Submit",
  initialData,
  onDraft,
  draftLabel = "Save Draft",
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isDrafting, setIsDrafting] = useState(false);
  const [stepHistory, setStepHistory] = useState<number[]>([]);
  const { showSnackbar } = useSnackbar();

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

  const pages = useMemo(() => {
    const p: any[][] = [];
    let current: any[] = [];
    fields?.forEach((field: any) => {
      if (field.type === FIELDS_TYPE.STEP_BREAK && !field.config?.isInline) {
        if (current.length > 0) p.push(current);
        current = [field];
      } else {
        current.push(field);
      }
    });
    if (current.length > 0) p.push(current);
    return p;
  }, [fields]);

  const currentPageFields = pages[activeStep] || [];

  const initialValues = React.useMemo(() => {
    return (
      fields?.reduce((acc: any, field: any) => {
        const valById = initialData?.[field.id];
        const valByLabel = initialData?.[field.label];
        const valByTrimmed = initialData?.[field.label?.trim()];
        
        const finalVal = valById !== undefined ? valById : (valByLabel !== undefined ? valByLabel : valByTrimmed);

        if (finalVal !== undefined && finalVal !== null) {
          if (field.type === FIELDS_TYPE.CHECKBOX || field.type === FIELDS_TYPE.SWITCH) {
            acc[field.id] = finalVal === true || String(finalVal).toLowerCase() === "true" || finalVal === "Yes";
          } else {
            acc[field.id] = finalVal;
          }
          return acc;
        }

        acc[field.id] = "";
        if (
          field.type === FIELDS_TYPE.CHECKBOX ||
          field.type === FIELDS_TYPE.SWITCH
        ) {
          acc[field.id] = false;
        }
        if (
          field.type === FIELDS_TYPE.SLIDER ||
          field.type === FIELDS_TYPE.RATING
        ) {
          acc[field.id] = 0;
        }
        return acc;
      }, {}) || {}
    );
  }, [fields, initialData]);

  const handleNextStep = async () => {
    const errors = await formik.validateForm();
    const currentPageErrors = Object.keys(errors).filter((key) =>
      currentPageFields.some((f: any) => f.id === key)
    );

    if (currentPageErrors.length > 0) {
      const touchedFields: Record<string, boolean> = {};
      currentPageErrors.forEach((key) => {
        touchedFields[key] = true;
      });
      formik.setTouched({ ...formik.touched, ...touchedFields });
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorElement = document.getElementById(currentPageErrors[0]);
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstErrorElement.focus();
        }
      }, 100);
      return;
    }

    let targetStepId: string | null = null;

    for (const field of currentPageFields) {
      if (["select", "radio", "autocomplete"].includes(field.type as any) && field.config?.enableBranching) {
        const val = formik.values[field.id];
        if (val && field.config.routing?.[val]) {
          targetStepId = field.config.routing[val];
        }
      }
    }

    setStepHistory((prev) => [...prev, activeStep]);

    if (targetStepId) {
      const targetPageIndex = pages.findIndex(
        (page) => page.length > 0 && page[0].type === FIELDS_TYPE.STEP_BREAK && page[0].id === targetStepId
      );
      if (targetPageIndex !== -1) {
        setActiveStep(targetPageIndex);
        return;
      }
    }

    setActiveStep((prev) => prev + 1);
  };

  const handleBackStep = () => {
    if (stepHistory.length > 0) {
      const prevStep = stepHistory[stepHistory.length - 1];
      setStepHistory((prev) => prev.slice(0, -1));
      setActiveStep(prevStep);
    } else {
      setActiveStep((prev) => prev - 1);
    }
  };

  const validationSchema = React.useMemo(() => {
    const schemaFields: Record<string, Yup.AnySchema> = {};
    fields?.forEach((field: any) => {
      let validator: any;
      switch (field.type) {
        case FIELDS_TYPE.TEXTFIELD:
        case FIELDS_TYPE.TEXTAREA:
        case FIELDS_TYPE.PASSWORD:
          validator = Yup.string();
          break;
        case FIELDS_TYPE.TEL_INPUT:
          validator = Yup.string().test(
            "isValidTel",
            "Invalid phone number",
            (value) => {
              if (!value) return true;
              return matchIsValidTel(value);
            }
          );
          break;
        case FIELDS_TYPE.SELECT:
        case FIELDS_TYPE.RADIO:
        case FIELDS_TYPE.AUTOCOMPLETE:
        case FIELDS_TYPE.COUNTRY_SELECTOR:
          validator = Yup.string();
          break;
        case FIELDS_TYPE.NUMBER_FIELD:
        case FIELDS_TYPE.SLIDER:
        case FIELDS_TYPE.RATING:
          validator = Yup.number();
          break;
        case FIELDS_TYPE.DATE_PICKER: {
          validator = Yup.string();
          if (field.label?.toLowerCase().includes("birth")) {
             validator = validator.test('age-range', 'Age must be between 10 and 25 years', (val: any) => {
                if (!val) return true;
                const diff = dayjs().diff(dayjs(val), 'year');
                return diff >= 10 && diff <= 25;
             });
          }
          break;
        }
        case FIELDS_TYPE.FILE_UPLOAD: {
          let fileValidator = Yup.mixed().nullable();
          if (field.config?.maxSize) {
            const maxSize = Number(field.config.maxSize) * 1024 * 1024;
            fileValidator = fileValidator.test(
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
            fileValidator = fileValidator.test(
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
          if (field.required || field.false) {
            fileValidator = fileValidator.test(
              "fileRequired",
              `${field.label} is required`,
              (value: any) => {
                return value !== null && value !== undefined && value !== "";
              }
            );
          }
          validator = fileValidator;
          break;
        }
        case FIELDS_TYPE.CHECKBOX:
        case FIELDS_TYPE.SWITCH:
          validator = Yup.boolean();
          break;
        default:
          return;
      }

      const lowercaseLabel = field.label?.toLowerCase() || "";

      // Password checks
      if (field.type === FIELDS_TYPE.PASSWORD || lowercaseLabel.includes("password")) {
        validator = validator
          .test("pass-min", "Password must be at least 8 characters", (val: any) => !val || val.length >= 8)
          .test("pass-up", "Password must include at least one uppercase letter", (val: any) => !val || /[A-Z]/.test(val))
          .test("pass-low", "Password must include at least one lowercase letter", (val: any) => !val || /[a-z]/.test(val))
          .test("pass-num", "Password must include at least one number", (val: any) => !val || /[0-9]/.test(val))
          .test("pass-sp", "Password must include at least one special character", (val: any) => !val || /[!@#$%^&*(),.?":{}|<>]/.test(val));
      }

      // Name fields validation
      if (
        lowercaseLabel === "name" ||
        lowercaseLabel.includes("first name") ||
        lowercaseLabel.includes("last name") ||
        lowercaseLabel.includes("father's name") ||
        lowercaseLabel.includes("mother's name")
      ) {
        validator = validator.test("name-val", "Only alphabets and spaces are allowed", (val: any) => !val || /^[A-Za-z\s]+$/.test(val));
      }

      // School Name validation
      if (lowercaseLabel.includes("school name")) {
        validator = validator.test("school-val", "Only alphabets, numbers, and basic punctuation are allowed", (val: any) => !val || /^[A-Za-z0-9\s'.-]+$/.test(val));
      }

      // Innovation Title validation
      if (lowercaseLabel.includes("innovation title")) {
        validator = validator.test("title-val", "Only alphabets and spaces are allowed", (val: any) => !val || /^[A-Za-z\s]+$/.test(val));
      }

      // Province/State/City validation
      if (
        lowercaseLabel.includes("province") ||
        lowercaseLabel.includes("state") ||
        lowercaseLabel.includes("city")
      ) {
        validator = validator.test("city-val", "Only alphabetic characters are allowed", (val: any) => !val || /^[A-Za-z\s'-]+$/.test(val));
      }

      // Zip Code validation
      if (
        lowercaseLabel.includes("zip") ||
        lowercaseLabel.includes("postal") ||
        lowercaseLabel.includes("pin code") ||
        lowercaseLabel.includes("pincode")
      ) {
        validator = validator
          .test("zip-val", "Only digits are allowed", (val: any) => !val || /^[0-9]+$/.test(val))
          .test("zip-min", "Zip Code is too short", (val: any) => !val || val.length >= 3)
          .test("zip-max", "Zip Code is too long", (val: any) => !val || val.length <= 10);
      }

      // Date of Birth / date picker validation
      if (
        field.type === FIELDS_TYPE.DATE_PICKER ||
        lowercaseLabel.includes("date of birth") ||
        lowercaseLabel.includes("dob")
      ) {
        validator = Yup.mixed()
          .test("isValidDate", "Invalid date format", (value: any) => {
            if (!value) return !field.required;
            return dayjs(value).isValid();
          });

        if (lowercaseLabel.includes("dob") || lowercaseLabel.includes("date of birth") || field.config?.disableFuture) {
          validator = validator.test("noFutureDate", "Date cannot be in the future", (value: any) => {
            if (!value) return true;
            return dayjs(value).isBefore(dayjs().endOf('day'));
          });
        }

        if (field.config?.disablePast) {
          validator = validator.test("noPastDate", "Date cannot be in the past", (value: any) => {
            if (!value) return true;
            return dayjs(value).isAfter(dayjs().startOf('day'));
          });
        }
      }

      if (lowercaseLabel.includes("email")) {
        validator = validator.test("email-val", "Invalid email format", (val: any) => !val || /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(val));
      }

      if (field.required || field.false) {
        if (field.type === FIELDS_TYPE.FILE_UPLOAD) {
          // Already handled in fileValidator
        } else if (field.type === FIELDS_TYPE.DATE_PICKER) {
          validator = validator.test(
            "dateRequired",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && value !== ""
          );
        } else if (
          field.type === FIELDS_TYPE.CHECKBOX ||
          field.type === FIELDS_TYPE.SWITCH
        ) {
          validator = validator.oneOf([true], "This field is required");
        } else {
          validator = validator.test(
            "required-trim",
            `${field.label} is required`,
            (value: any) => value !== null && value !== undefined && (typeof value === 'string' ? value.trim() !== '' : value !== false)
          );
        }
      }

      schemaFields[field.id] = validator;
    });
    return Yup.object(schemaFields);
  }, [fields]);

  const visitedFields = useMemo(() => {
    const visible: any[] = [];
    [...stepHistory, activeStep].forEach(index => {
      if (pages[index]) visible.push(...pages[index]);
    });
    return visible;
  }, [stepHistory, activeStep, pages]);

  const formik = useFormik({
    initialValues,
    enableReinitialize: true,
    validate: (values) => {
      const visibleFieldIds = new Set(visitedFields.map(f => f.id));
      try {
        validationSchema.validateSync(values, { abortEarly: false });
        return {};
      } catch (err: any) {
        const errors: any = {};
        err.inner.forEach((error: any) => {
          if (visibleFieldIds.has(error.path)) {
            errors[error.path] = error.message;
          }
        });
        return errors;
      }
    },
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={4}>
        {currentPageFields?.map((val: any) => {
          const isFullWidth = val.type === FIELDS_TYPE.TEXTBLOCK || val.type === FIELDS_TYPE.TEXTAREA || val.type === FIELDS_TYPE.SWITCH || val.type === FIELDS_TYPE.CHECKBOX || val.type === FIELDS_TYPE.RADIO || val.type === FIELDS_TYPE.FILE_UPLOAD;
          if (val.type === FIELDS_TYPE.STEP_BREAK) {
            return (
              <Grid key={val.id} size={{ xs: 12 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: "primary.main" }}>
                  {val.label}
                </Typography>
                {val.placeholder && (
                  <Typography variant="body2" color="text.secondary">
                    {val.placeholder}
                  </Typography>
                )}
              </Grid>
            );
          }
          return (
          <Grid key={val.id} size={{xs:12, md: isFullWidth ? 12 : 6}}>
            {val.type === FIELDS_TYPE.TEXTBLOCK && (
              <Box sx={{ width: "100%", pb: 1 }}>
                <Typography sx={{ fontFamily: montserrat.style.fontFamily, whiteSpace: "pre-wrap" }}>
                  {val.label}
                </Typography>
              </Box>
            )}

            {(val.type === FIELDS_TYPE.TEXTFIELD ||
              val.type === FIELDS_TYPE.TEXTAREA ||
              val.type === FIELDS_TYPE.NUMBER_FIELD ||
              val.type === FIELDS_TYPE.PASSWORD) && (
              <Box>
              <TextField
                label={val.label || val.placeholder}
                type={
                  val.type === FIELDS_TYPE.NUMBER_FIELD
                    ? "number"
                    : val.type === FIELDS_TYPE.PASSWORD
                    ? "password"
                    : "text"
                }
                autoComplete={val.type === FIELDS_TYPE.PASSWORD ? "new-password" : "off"}
                multiline={val.type === FIELDS_TYPE.TEXTAREA}
                minRows={val.type === FIELDS_TYPE.TEXTAREA ? 4 : undefined}
                maxRows={val.type === FIELDS_TYPE.TEXTAREA ? 10 : undefined}
                variant={val.variant || "outlined"}
                placeholder={val.placeholder}
                fullWidth
                required={val.required || val.false}
                name={val.id}
                value={formik.values[val.id] || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={Boolean(getFieldError(val.id))}
                helperText={getFieldError(val.id) || val.helperText}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    "& fieldset": {
                      borderColor: "#e2e8f0",
                    },
                    "&:hover fieldset": {
                      borderColor: "#cbd5e1",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#6366f1",
                    },
                  },
                }}
              />
              {val.type === FIELDS_TYPE.TEXTAREA && val.config?.maxWords && (
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5, display: "block" }}>
                  Max words: {val.config.maxWords}
                </Typography>
              )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.TEL_INPUT && (
              (() => {
                const phoneVal = formik.values[val.id] || "";
                const parsed = parsePhoneNumberFromString(phoneVal);
                const countryCode = parsed?.country || val.config?.defaultCountry || "IN";
                const example = getExampleNumber(countryCode as any, examples);
                const maxLength = example ? example.formatInternational().length : 15;

                return (
                  <Box>
                    <MuiTelInput
                      onKeyDown={(e) => {
                        const allowedKeys = ["Backspace", "Delete", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"];
                        if (phoneVal.length >= maxLength && !allowedKeys.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                          e.preventDefault();
                        }
                      }}
                      label={val.label || val.placeholder}
                  variant={val.variant || "outlined"}
                  fullWidth
                  required={val.required || val.false}
                  name={val.id}
                  value={formik.values[val.id] || ""}
                  onChange={(value) => {
                    formik.setFieldValue(val.id, value);
                    formik.setFieldTouched(val.id, true, false);
                  }}
                  onBlur={() => formik.setFieldTouched(val.id, true)}
                  error={Boolean(getFieldError(val.id))}
                  defaultCountry={(val.config?.defaultCountry || "IN") as any}
                  forceCallingCode
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      backgroundColor: "#ffffff",
                      "& fieldset": { borderColor: "#e2e8f0" },
                      "&:hover fieldset": { borderColor: "#cbd5e1" },
                      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                    },
                  }}
                />
                {getFieldError(val.id) && (
                  <FormHelperText error>
                    {getFieldError(val.id)}
                  </FormHelperText>
                )}
              </Box>
                );
              })()
            )}

            {val.type === FIELDS_TYPE.DATE_PICKER && (
              <Box>
                {(() => {
                  const isBirthDate = val.label?.toLowerCase().includes("birth");
                  return (
                    <DatePicker
                      label={val.label || val.placeholder}
                      value={formik.values[val.id] ? dayjs(formik.values[val.id]) : null}
                      onChange={(newValue) =>
                        formik.setFieldValue(
                          val.id,
                          newValue && newValue.isValid() ? newValue.toISOString() : null
                        )
                      }
                      slotProps={{
                        textField: {
                          error: Boolean(getFieldError(val.id)),
                          helperText: getFieldError(val.id) || val.helperText,
                          required: val.required || val.false,
                        },
                      }}
                      disablePast={isBirthDate ? false : val.config?.disablePast}
                      disableFuture={isBirthDate ? true : val.config?.disableFuture}
                      minDate={isBirthDate ? dayjs().subtract(25, 'year') : undefined}
                      maxDate={isBirthDate ? dayjs().subtract(10, 'year') : undefined}
                      sx={{
                        width: "100%",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          backgroundColor: "#ffffff",
                          "& fieldset": { borderColor: "#e2e8f0" },
                          "&:hover fieldset": { borderColor: "#cbd5e1" },
                          "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                        },
                      }}
                    />
                  );
                })()}
              </Box>
            )}

            {(val.type === FIELDS_TYPE.AUTOCOMPLETE || val.type === FIELDS_TYPE.SELECT) && (
              (() => {
                const isCountryField = val.id === "country" || val.label?.toLowerCase().includes("country");
                
                if (isCountryField) {
                  return (
                    <Autocomplete
                      id={val.id}
                      options={countries}
                      autoHighlight
                      getOptionLabel={(option) => option.label}
                      renderOption={(props, option) => {
                        const { key, ...optionProps } = props;
                        return (
                          <Box
                            key={key}
                            component="li"
                            sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                            {...optionProps}
                          >
                            <img
                              loading="lazy"
                              width="20"
                              srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                              src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                              alt=""
                            />
                            {option.label}
                          </Box>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={val.label || "Choose a country"}
                          fullWidth
                          error={Boolean(getFieldError(val.id))}
                          helperText={getFieldError(val.id) || val.helperText}
                          required={val.required || val.false}
                          sx={{
                            "& .MuiOutlinedInput-root": {
                              borderRadius: "10px",
                              backgroundColor: "#ffffff",
                              "& fieldset": { borderColor: "#e2e8f0" },
                              "&:hover fieldset": { borderColor: "#cbd5e1" },
                              "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                            },
                          }}
                        />
                      )}
                      value={
                        countries.find((c) => c.label === formik.values[val.id]) || null
                      }
                      onChange={(_, newValue) =>
                        formik.setFieldValue(val.id, newValue?.label || "")
                      }
                      onBlur={() => formik.setFieldTouched(val.id, true)}
                    />
                  );
                }

                if (val.type === FIELDS_TYPE.SELECT) {
                  return (
                    <FormControl
                      fullWidth
                      variant={val.variant || "outlined"}
                      error={Boolean(getFieldError(val.id))}
                    >
                      <InputLabel>{val.label || val.placeholder}</InputLabel>
                      <Select
                        label={val.label || val.placeholder}
                        name={val.id}
                        value={formik.values[val.id] || ""}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        sx={{
                          borderRadius: "10px",
                          backgroundColor: "#ffffff",
                          "& fieldset": { borderColor: "#e2e8f0" },
                          "&:hover fieldset": { borderColor: "#cbd5e1" },
                          "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                        }}
                      >
                        {(val.options as string[])?.map((opt: string) => (
                          <MenuItem key={opt} value={opt}>
                            {opt}
                          </MenuItem>
                        ))}
                      </Select>
                      {getFieldError(val.id) || val.helperText ? (
                        <FormHelperText>
                          {getFieldError(val.id) || val.helperText}
                        </FormHelperText>
                      ) : null}
                    </FormControl>
                  );
                }

                // Default AUTOCOMPLETE
                return (
                  <Autocomplete
                    options={(val.options as string[]) || []}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={val.label || val.placeholder}
                        variant={val.variant || "outlined"}
                        placeholder={val.placeholder}
                        error={Boolean(getFieldError(val.id))}
                        helperText={getFieldError(val.id) || val.helperText}
                        required={val.required || val.false}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            backgroundColor: "#ffffff",
                            "& fieldset": { borderColor: "#e2e8f0" },
                            "&:hover fieldset": { borderColor: "#cbd5e1" },
                            "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                          },
                        }}
                      />
                    )}
                    value={formik.values[val.id] || null}
                    onChange={(_, newValue) => formik.setFieldValue(val.id, newValue)}
                    onBlur={() => formik.setFieldTouched(val.id, true)}
                  />
                );
              })()
            )}

            {val.type === FIELDS_TYPE.COUNTRY_SELECTOR && (
                <Autocomplete
                  id={val.id}
                  options={countries}
                  autoHighlight
                  getOptionLabel={(option) => option.label}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box
                        key={key}
                        component="li"
                        sx={{ "& > img": { mr: 2, flexShrink: 0 } }}
                        {...optionProps}
                      >
                        <img
                          loading="lazy"
                          width="20"
                          srcSet={`https://flagcdn.com/w40/${option.code.toLowerCase()}.png 2x`}
                          src={`https://flagcdn.com/w20/${option.code.toLowerCase()}.png`}
                          alt=""
                        />
                        {option.label}
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={val.label || "Choose a country"}
                      fullWidth
                      error={Boolean(getFieldError(val.id))}
                      helperText={getFieldError(val.id) || val.helperText}
                      required={val.required || val.false}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          backgroundColor: "#ffffff",
                          "& fieldset": { borderColor: "#e2e8f0" },
                          "&:hover fieldset": { borderColor: "#cbd5e1" },
                          "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                        },
                      }}
                    />
                  )}
                  value={
                    countries.find((c) => c.label === formik.values[val.id]) || null
                  }
                  onChange={(_, newValue) =>
                    formik.setFieldValue(val.id, newValue?.label || "")
                  }
                  onBlur={() => formik.setFieldTouched(val.id, true)}
                />
              )}

            {(val.type === FIELDS_TYPE.CHECKBOX ||
              val.type === FIELDS_TYPE.SWITCH) && (
              <Box>
                <FormControlLabel
                  sx={val.type === FIELDS_TYPE.SWITCH ? { width: "100%", m: 0, justifyContent: "space-between" } : undefined}
                  labelPlacement={val.type === FIELDS_TYPE.SWITCH ? "start" : "end"}
                  control={
                    val.type === FIELDS_TYPE.CHECKBOX ? (
                      <Checkbox
                        name={val.id}
                        checked={Boolean(formik.values[val.id])}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    ) : (
                      <Switch
                        name={val.id}
                        checked={Boolean(formik.values[val.id])}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                    )
                  }
                  label={val.label}
                />
                {getFieldError(val.id) && (
                  <FormHelperText error>{getFieldError(val.id)}</FormHelperText>
                )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.RADIO && (
              <FormControl
                component="fieldset"
                error={Boolean(getFieldError(val.id))}
              >
                <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                  {val.label}
                </Typography>
                <RadioGroup
                  name={val.id}
                  value={formik.values[val.id] || ""}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {(val.options as string[])?.map((opt: string) => (
                    <FormControlLabel key={opt} value={opt} control={<Radio />} label={opt} />
                  ))}
                </RadioGroup>
                {getFieldError(val.id) && (
                  <FormHelperText>{getFieldError(val.id)}</FormHelperText>
                )}
              </FormControl>
            )}

            {(val.type === FIELDS_TYPE.SLIDER || val.type === FIELDS_TYPE.RATING) && (
              <Box sx={{ px: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>
                  {val.label}
                </Typography>
                {val.type === FIELDS_TYPE.SLIDER ? (
                  <Slider
                    name={val.id}
                    value={formik.values[val.id] || 0}
                    onChange={(_, value) => formik.setFieldValue(val.id, value)}
                    onBlur={() => formik.setFieldTouched(val.id, true)}
                    valueLabelDisplay="auto"
                  />
                ) : (
                  <Rating
                    name={val.id}
                    value={Number(formik.values[val.id]) || 0}
                    onChange={(_, value) => formik.setFieldValue(val.id, value)}
                    onBlur={() => formik.setFieldTouched(val.id, true)}
                  />
                )}
                {getFieldError(val.id) && (
                  <FormHelperText error>{getFieldError(val.id)}</FormHelperText>
                )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.FILE_UPLOAD && (
              <Box sx={{ p: 1.5, border: "1px dashed", borderColor: "divider", borderRadius: "10px", position: "relative", width: { xs: "100%", sm: "fit-content" }, pr: { sm: 3 } }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, textAlign: "left" }}>
                    {val.label}{(val.required || val.false) && " *"}
                  </Typography>
                  
                  {!formik.values[val.id] && (
                    <Button variant="outlined" component="label" size="small" sx={{ whiteSpace: 'nowrap' }}>
                      Upload File
                      <input 
                        type="file" 
                        hidden 
                        accept={val.config?.allowedExtensions || undefined}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            formik.setFieldValue(val.id, e.target.files[0]);
                          }
                        }}
                      />
                    </Button>
                  )}
                </Box>

                {formik.values[val.id] && (
                  <Box sx={{ mt: 2, position: "relative", display: "flex", justifyContent: "flex-start", width: "100%" }}>
                    {(() => {
                        const fileVal = formik.values[val.id];
                        const downloadUrl = initialData?.[`${val.id}_downloadUrl`] || initialData?.[`${val.label}_downloadUrl`] || initialData?.[`${val.label?.trim()}_downloadUrl`];
                        return (
                          <FilePreview 
                            fileVal={fileVal} 
                            previewUrl={typeof fileVal === "string" ? downloadUrl : undefined}
                            label={val.label} 
                            onClear={() => formik.setFieldValue(val.id, null)} 
                          />
                        );
                      })()}
                  </Box>
                )}

                {getFieldError(val.id) && (
                  <FormHelperText error sx={{ textAlign: "left", mt: 1 }}>
                    {getFieldError(val.id)}
                  </FormHelperText>
                )}
              </Box>
            )}
          </Grid>
          );
        })}
      </Grid>
      
      <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid", borderColor: "divider", pt: 3 }}>
        <Box>
          {activeStep > 0 && (
            <Button
              variant="outlined"
              onClick={handleBackStep}
              disabled={formik.isSubmitting || isDrafting}
              sx={{ borderRadius: 2, px: 4, py: 1.5, fontFamily: montserrat.style.fontFamily, fontWeight: 600 }}
            >
              Back
            </Button>
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          {onDraft && (
            <Button
              variant="outlined"
              disabled={formik.isSubmitting || isDrafting}
              onClick={async () => {
                setIsDrafting(true);
                try {
                  await onDraft(formik.values);
                } finally {
                  setIsDrafting(false);
                }
              }}
              startIcon={isDrafting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                borderRadius: 2,
                px: 4,
                py: 1.5,
                borderColor: "#6366f1",
                color: "#6366f1",
                fontFamily: montserrat.style.fontFamily,
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#4f46e5",
                  backgroundColor: "rgba(99, 102, 241, 0.04)",
                },
                transition: "all 0.2s ease-in-out",
              }}
            >
              {isDrafting ? "Saving..." : draftLabel}
            </Button>
          )}
          <Button
            variant="contained"
            disabled={formik.isSubmitting || isDrafting}
            onClick={async () => {
              if (activeStep === pages.length - 1 || pages.length === 0) {
                const errors = await formik.validateForm();
                const errorKeys = Object.keys(errors);
                if (errorKeys.length > 0) {
                  const touchedFields: Record<string, boolean> = {};
                  errorKeys.forEach((key) => {
                    touchedFields[key] = true;
                  });
                  formik.setTouched(touchedFields);
                  
                  // Scroll to first error
                  setTimeout(() => {
                    const firstErrorElement = document.getElementById(errorKeys[0]);
                    if (firstErrorElement) {
                      firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      firstErrorElement.focus();
                    }
                  }, 100);
                }
                if (initialData && Object.keys(initialData).length > 0 && !formik.dirty) {
                  showSnackbar("Please make some changes before updating", "warning");
                  return;
                }
                formik.handleSubmit();
              } else {
                handleNextStep();
              }
            }}
            startIcon={formik.isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{
              borderRadius: 2,
              px: 6,
              py: 1.5,
              background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
              boxShadow: "0px 8px 16px rgba(99, 102, 241, 0.2)",
              fontFamily: montserrat.style.fontFamily,
              fontWeight: 600,
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "0px 12px 20px rgba(99, 102, 241, 0.3)",
              },
              transition: "all 0.2s ease-in-out",
            }}
          >
            {activeStep === pages.length - 1 || pages.length === 0 ? (formik.isSubmitting ? "Processing..." : submitLabel) : "Next"}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicFormRenderer;
