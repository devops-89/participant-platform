import { Close, Person } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import React, { useState } from "react";

interface TeamMemberField {
  id: string;
  label: string;
  value?: string | number | boolean | null;
  type?: string;
}

interface TeamMemberGroup {
  title: string;
  fields: TeamMemberField[];
}

interface ColorPalette {
  PRIMARY: string;
  SECONDARY: string;
  TEXT_PRIMARY: string;
  TEXT_SECONDARY: string;
  BORDER: string;
}

interface TeamMembersSectionProps {
  memberGroups: TeamMemberGroup[];
  colors: ColorPalette;
  participantEmail?: string;
  renderFieldValue: (field: TeamMemberField) => React.ReactNode;
}

export default function TeamMembersSection({
  memberGroups,
  colors,
  participantEmail,
  renderFieldValue,
}: TeamMembersSectionProps) {
  const [selectedMemberGroup, setSelectedMemberGroup] =
    useState<TeamMemberGroup | null>(null);

  if (!memberGroups || memberGroups.length === 0) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4, mt: 2 }}
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
          sx={{ fontWeight: 800, color: colors.TEXT_PRIMARY, mt: 3 }}
        >
          Team Members
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {memberGroups.map((group, gIdx) => {
          const nameField = group.fields.find(
            (f: TeamMemberField) =>
              f.label?.toLowerCase().includes("name") &&
              !f.label?.toLowerCase().includes("father") &&
              !f.label?.toLowerCase().includes("mother") &&
              !f.label?.toLowerCase().includes("school")
          );

          const emailField = group.fields.find(
            (f: TeamMemberField) =>
              f.label?.toLowerCase().includes("email") &&
              !f.label?.toLowerCase().includes("father") &&
              !f.label?.toLowerCase().includes("mother") &&
              !f.label?.toLowerCase().includes("principal") &&
              !f.label?.toLowerCase().includes("school")
          );

          let emailToDisplay = String(emailField?.value ?? "");

          if (gIdx === 0 && !emailToDisplay) {
            emailToDisplay = participantEmail || "";
          }

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={gIdx}>
              <Card
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: `1px solid ${colors.BORDER}`,
                  boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.PRIMARY,
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    mb: 2,
                  }}
                >
                  {group.title}
                </Typography>

                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mb: 2,
                    bgcolor: "rgba(99, 102, 241, 0.1)",
                    color: colors.PRIMARY,
                  }}
                >
                  <Person sx={{ fontSize: 40 }} />
                </Avatar>

                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.TEXT_PRIMARY,
                    mb: 0.5,
                  }}
                >
                  {nameField?.value ?? "Unknown Name"}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{ color: colors.TEXT_SECONDARY, mb: 3 }}
                >
                  {emailToDisplay || "No Email Provided"}
                </Typography>

                <Box sx={{ mt: "auto", width: "100%" }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setSelectedMemberGroup(group)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 600,
                      borderColor: colors.PRIMARY,
                      color: colors.PRIMARY,
                      "&:hover": {
                        bgcolor: "rgba(99, 102, 241, 0.04)",
                      },
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog
        open={Boolean(selectedMemberGroup)}
        onClose={() => setSelectedMemberGroup(null)}
        maxWidth="sm"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 4,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            pt: 3,
          }}
        >
          <Typography
            component="div"
            variant="h5"
            sx={{
              fontWeight: 800,
              color: colors.TEXT_PRIMARY,
            }}
          >
            {selectedMemberGroup?.title}
          </Typography>

          <IconButton
            onClick={() => setSelectedMemberGroup(null)}
            sx={{ color: colors.TEXT_SECONDARY }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ borderColor: colors.BORDER, p: 0 }}>
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {selectedMemberGroup?.fields
              ?.filter(
                (field: TeamMemberField) =>
                  !field.label
                    ?.toLowerCase()
                    .includes("do you want to add another")
              )
              .map(
                (
                  field: TeamMemberField,
                  idx: number,
                  arr: TeamMemberField[]
                ) => (
                  <Box
                    key={field.id}
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      alignItems: {
                        xs: "flex-start",
                        sm: "center",
                      },
                      py: 2.5,
                      px: 3,
                      borderBottom:
                        idx === arr.length - 1
                          ? "none"
                          : `1px solid ${colors.BORDER}`,
                      "&:hover": {
                        bgcolor: "rgba(99, 102, 241, 0.04)",
                      },
                      gap: { xs: 1, sm: 3 },
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        width: { xs: "100%", sm: "40%" },
                        color: colors.TEXT_SECONDARY,
                        fontWeight: 700,
                      }}
                    >
                      {field.label}
                    </Typography>

                    <Box
                      sx={{
                        width: { xs: "100%", sm: "60%" },
                      }}
                    >
                      {renderFieldValue(field)}
                    </Box>
                  </Box>
                )
              )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={() => setSelectedMemberGroup(null)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              bgcolor: colors.PRIMARY,
              "&:hover": {
                bgcolor: colors.SECONDARY,
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
