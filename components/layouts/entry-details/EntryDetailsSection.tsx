import { ArrowForward, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Typography,
} from "@mui/material";
import React from "react";

interface EntryField {
  id: string;
  label: string;
  value?: string | number | boolean | null;
  type: string;
}

interface EntryGroup {
  title?: string;
  fields: EntryField[];
}

interface ColorPalette {
  PRIMARY: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  BORDER: string;
  SURFACE: string;
}

interface EntryDetailsSectionProps {
  otherGroups: EntryGroup[];
  colors: ColorPalette;
  videoId: string | null;
  memberGroupsLength: number;
  getFieldIcon: (type: string, label: string) => React.ReactNode;
  renderFieldValue: (field: EntryField) => React.ReactNode;
}

export default function EntryDetailsSection({
  otherGroups,
  colors,
  videoId,
  memberGroupsLength,
  getFieldIcon,
  renderFieldValue,
}: EntryDetailsSectionProps) {
  if (!otherGroups || otherGroups.length === 0) return null;

  return (
    <>
      {otherGroups.map((group, gIdx) => {
        // For the Patent Details group, hide the entire section (heading included)
        // when the applicant answered "No" to having filed a patent.
        const isPatentGroup = group.title
          ?.toLowerCase()
          .includes("patent details");

        if (isPatentGroup) {
          const filedField = group.fields.find((f: EntryField) =>
            f.label?.toLowerCase().includes("have you filed a patent")
          );

          const hasFiledPatent =
            String(filedField?.value || "").toLowerCase() === "yes";

          if (!hasFiledPatent) return null;
        }

        return (
          <Box key={gIdx} sx={{ mb: 5 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                mb: 4,
                mt:
                  gIdx !== 0 || videoId || memberGroupsLength > 0 ? 2 : 0,
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 24,
                  borderRadius: 1,
                  bgcolor: colors.PRIMARY,
                  mt: 3,
                }}
              />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: colors.TEXT_PRIMARY,
                  mt: 3,
                }}
              >
                {group.title}
              </Typography>
            </Box>

            {group.title?.toLowerCase().includes("innovation details") ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {group.fields
                  .filter(
                    (field: EntryField) =>
                      !field.label
                        ?.toLowerCase()
                        .includes("category") &&
                      !field.label
                        ?.toLowerCase()
                        .includes("youtube") &&
                      !field.label
                        ?.toLowerCase()
                        .includes("video link")
                  )
                  .map((field: EntryField) => (
                    <Accordion
                      key={field.id}
                      sx={{
                        borderRadius: "12px !important",
                        "&:before": { display: "none" },
                        boxShadow: "0 4px 20px -5px rgba(0,0,0,0.05)",
                        border: `1px solid ${colors.BORDER}`,
                        overflow: "hidden",
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMore />}
                        sx={{
                          px: { xs: 2, sm: 3 },
                          py: 1.5,
                          "&:hover": {
                            bgcolor: "rgba(99, 102, 241, 0.02)",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2.5,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: "rgba(99, 102, 241, 0.08)",
                              color: colors.PRIMARY,
                            }}
                          >
                            <ArrowForward fontSize="small" />
                          </Box>
                          <Typography
                            variant="body1"
                            sx={{
                              color: colors.TEXT_PRIMARY,
                              fontWeight: 700,
                            }}
                          >
                            {field.label}
                          </Typography>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails
                        sx={{
                          px: { xs: 2, sm: 3 },
                          pb: 3,
                          pt: 1,
                          borderTop: `1px solid ${colors.BORDER}`,
                        }}
                      >
                        {renderFieldValue(field)}
                      </AccordionDetails>
                    </Accordion>
                  ))}
              </Box>
            ) : group.title?.toLowerCase().includes("patent details") ? (
              (() => {
                const filedField = group.fields.find((f: EntryField) =>
                  f.label
                    ?.toLowerCase()
                    .includes("have you filed a patent")
                );

                const hasFiledPatent =
                  String(filedField?.value || "").toLowerCase() === "yes";

                const patentInfoLabels = [
                  "patent application no",
                  "patent application country",
                  "patent filing date",
                  "google patent link",
                ];

                const patentInfoFields = group.fields.filter(
                  (field: EntryField) =>
                    patentInfoLabels.some((label) =>
                      field.label?.toLowerCase().includes(label)
                    )
                );

                if (!hasFiledPatent) return null;

                const visibleFields = patentInfoFields.filter(
                  (field: EntryField) =>
                    field.value !== undefined &&
                    field.value !== null &&
                    field.value !== ""
                );

                if (visibleFields.length === 0) return null;

                return (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "1fr 1fr",
                      },
                      gap: 2,
                    }}
                  >
                    {visibleFields.map((field: EntryField) => (
                      <Box
                        key={field.id}
                        sx={{
                          p: 3,
                          borderRadius: 3,
                          bgcolor: "rgba(99, 102, 241, 0.03)",
                          border: `1px solid ${colors.BORDER}`,
                        }}
                      >
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: colors.TEXT_PRIMARY,
                            fontWeight: 700,
                            mb: 1.5,
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <span>{field.label}</span>
                        </Typography>

                        <Box
                          sx={{
                            pl: 3,
                            borderLeft:
                              "3px solid rgba(99, 102, 241, 0.2)",
                          }}
                        >
                          {renderFieldValue(field)}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                );
              })()
            ) : (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  bgcolor: colors.SURFACE,
                  borderRadius: 4,
                  border: `1px solid ${colors.BORDER}`,
                  p: 1,
                  boxShadow:
                    "0 10px 40px -10px rgba(0,0,0,0.06)",
                  overflow: "hidden",
                }}
              >
                {group.fields.map(
                  (field: EntryField, idx: number) => (
                    <Box
                      key={field.id}
                      sx={{
                        display: "flex",
                        flexDirection: {
                          xs: "column",
                          sm: "row",
                        },
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        py: 3,
                        borderBottom:
                          idx === group.fields.length - 1
                            ? "none"
                            : `1px solid ${colors.BORDER}`,
                        "&:hover": {
                          bgcolor: "rgba(99, 102, 241, 0.04)",
                        },
                        px: { xs: 3, sm: 4 },
                        gap: { xs: 1.5, sm: 0 },
                        transition: "background-color 0.3s ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: {
                            xs: "100%",
                            sm: "35%",
                            md: "30%",
                          },
                          display: "flex",
                          alignItems: "center",
                          gap: 2.5,
                          flexShrink: 0,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            p: 1.2,
                            borderRadius: 2,
                            bgcolor:
                              "rgba(99, 102, 241, 0.08)",
                            color: colors.PRIMARY,
                            boxShadow:
                              "inset 0 2px 4px rgba(0,0,0,0.02)",
                          }}
                        >
                          {getFieldIcon(field.type, field.label)}
                        </Box>

                        <Typography
                          variant="body1"
                          sx={{
                            color: colors.TEXT_SECONDARY,
                            fontWeight: 700,
                            letterSpacing: 0.5,
                          }}
                        >
                          {field.label}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          width: {
                            xs: "100%",
                            sm: "65%",
                            md: "70%",
                          },
                          pl: { xs: 0, sm: 3 },
                          pt: { xs: 1, sm: 0 },
                          borderLeft: {
                            xs: "none",
                            sm: "2px solid rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        {renderFieldValue(field)}
                      </Box>
                    </Box>
                  )
                )}
              </Box>
            )}
          </Box>
        );
      })}
    </>
  );
}