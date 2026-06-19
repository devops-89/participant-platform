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
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { useFormik } from "formik";
import { MuiTelInput } from "mui-tel-input";
import React from "react";
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
  initialData = {},
  onDraft,
  draftLabel = "Save as Draft",
}) => {
  const [isDrafting, setIsDrafting] = React.useState(false);

  const initialValues = React.useMemo(() => {
    return (
      fields?.reduce((acc: any, field: any) => {
        if (initialData && initialData[field.id] !== undefined) {
          acc[field.id] = initialData[field.id];
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

  const validationSchema = React.useMemo(() => {
    const schemaFields: Record<string, Yup.AnySchema> = {};
    fields?.forEach((field: any) => {
      let validator: any;
      switch (field.type) {
        case FIELDS_TYPE.TEXTFIELD:
        case FIELDS_TYPE.PASSWORD:
        case FIELDS_TYPE.TEL_INPUT:
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
        case FIELDS_TYPE.DATE_PICKER:
          validator = Yup.string();
          break;
        case FIELDS_TYPE.FILE_UPLOAD: {
          let fileValidator = Yup.mixed();
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

      if (field.required || field.false) {
        validator = validator.required(`${field.label} is required`);
      }
      schemaFields[field.id] = validator;
    });
    return Yup.object(schemaFields);
  }, [fields]);

  const formik = useFormik({
    initialValues,
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await onSubmit(values);
    },
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Grid container spacing={4}>
        {fields?.map((val: any) => (
          <Grid key={val.id} size={{xs:12, md:6}}>
            {(val.type === FIELDS_TYPE.TEXTFIELD ||
              val.type === FIELDS_TYPE.NUMBER_FIELD ||
              val.type === FIELDS_TYPE.PASSWORD) && (
              <TextField
                label={val.label || val.placeholder}
                type={
                  val.type === FIELDS_TYPE.NUMBER_FIELD
                    ? "number"
                    : val.type === FIELDS_TYPE.PASSWORD
                    ? "password"
                    : "text"
                }
                variant={val.variant || "outlined"}
                placeholder={val.placeholder}
                fullWidth
                required={val.required || val.false}
                name={val.id}
                value={formik.values[val.id] || ""}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
                helperText={
                  (formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                  val.helperText
                }
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
            )}

            {val.type === FIELDS_TYPE.TEL_INPUT && (
              <Box>
                <MuiTelInput
                  label={val.label || val.placeholder}
                  variant={val.variant || "outlined"}
                  fullWidth
                  required={val.required || val.false}
                  name={val.id}
                  value={formik.values[val.id] || ""}
                  onChange={(value) => formik.setFieldValue(val.id, value)}
                  onBlur={() => formik.setFieldTouched(val.id, true)}
                  error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
                  defaultCountry={val.config?.defaultCountry}
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
                {formik.touched[val.id] && formik.errors[val.id] && (
                  <FormHelperText error>
                    {formik.errors[val.id] as string}
                  </FormHelperText>
                )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.DATE_PICKER && (
              <Box>
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
                      error: formik.touched[val.id] && Boolean(formik.errors[val.id]),
                      helperText:
                        (formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                        val.helperText,
                      required: val.required || val.false,
                    },
                  }}
                  disablePast={val.config?.disablePast}
                  disableFuture={val.config?.disableFuture}
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
              </Box>
            )}

            {val.type === FIELDS_TYPE.SELECT && (
              <FormControl
                fullWidth
                variant={val.variant || "outlined"}
                error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
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
                {(formik.touched[val.id] && formik.errors[val.id]) || val.helperText ? (
                  <FormHelperText>
                    {(formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                      val.helperText}
                  </FormHelperText>
                ) : null}
              </FormControl>
            )}

            {val.type === FIELDS_TYPE.AUTOCOMPLETE && (
              <Autocomplete
                options={(val.options as string[]) || []}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={val.label || val.placeholder}
                    variant={val.variant || "outlined"}
                    placeholder={val.placeholder}
                    error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
                    helperText={
                      (formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                      val.helperText
                    }
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
            )}

            {val.type === FIELDS_TYPE.COUNTRY_SELECTOR &&
              (val.options?.length ? (
                <Autocomplete
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={val.label || "Country Of Residence"}
                      error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
                      helperText={
                        (formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                        val.helperText
                      }
                      required={val.required || val.false}
                    />
                  )}
                  options={val.options}
                  value={formik.values[val.id] || null}
                  onChange={(_, newValue) => formik.setFieldValue(val.id, newValue)}
                  onBlur={() => formik.setFieldTouched(val.id, true)}
                />
              ) : (
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
                      error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
                      helperText={
                        (formik.touched[val.id] && (formik.errors[val.id] as string)) ||
                        val.helperText
                      }
                      required={val.required || val.false}
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
              ))}

            {(val.type === FIELDS_TYPE.CHECKBOX ||
              val.type === FIELDS_TYPE.SWITCH) && (
              <Box>
                <FormControlLabel
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
                {formik.touched[val.id] && formik.errors[val.id] && (
                  <FormHelperText error>{formik.errors[val.id] as string}</FormHelperText>
                )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.RADIO && (
              <FormControl
                component="fieldset"
                error={formik.touched[val.id] && Boolean(formik.errors[val.id])}
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
                {formik.touched[val.id] && formik.errors[val.id] && (
                  <FormHelperText>{formik.errors[val.id] as string}</FormHelperText>
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
                {formik.touched[val.id] && formik.errors[val.id] && (
                  <FormHelperText error>{formik.errors[val.id] as string}</FormHelperText>
                )}
              </Box>
            )}

            {val.type === FIELDS_TYPE.FILE_UPLOAD && (
              <Box sx={{ p: 2, border: "1px dashed", borderColor: "divider", borderRadius: "10px", textAlign: "center" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {val.label} {(val.required || val.false) && "*"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {val.config?.allowedExtensions ? `Allowed: ${val.config?.allowedExtensions}` : "All files allowed"} 
                  {val.config?.maxSize ? ` (Max: ${val.config?.maxSize}MB)` : ""}
                </Typography>
                <Button variant="outlined" component="label" size="small">
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
                {formik.values[val.id] && (
                  <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                    Selected: {(formik.values[val.id] as File).name || "File attached"}
                  </Typography>
                )}
                {formik.touched[val.id] && formik.errors[val.id] && (
                  <FormHelperText error sx={{ textAlign: "center", mt: 1 }}>
                    {formik.errors[val.id] as string}
                  </FormHelperText>
                )}
              </Box>
            )}
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
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
          onClick={() => formik.handleSubmit()}
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
          {formik.isSubmitting ? "Processing..." : submitLabel}
        </Button>
      </Box>
    </LocalizationProvider>
  );
};

export default DynamicFormRenderer;
