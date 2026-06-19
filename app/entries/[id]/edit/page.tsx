import { Box, Typography, Button, TextField } from "@mui/material";
import Link from "next/link";
import { ArrowBack, Save } from "@mui/icons-material";
import Breadcrumb from "@/components/widgets/Breadcrumb";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Box sx={{ p: 4, mt: 8 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumb
          title={`Edit Entry: ${id}`}
          data={[
            { title: "Dashboard", href: "/dashboard" },
            { title: "Entries", href: "/entries" },
            { title: "Edit", href: `/entries/${id}/edit` },
          ]}
        />
      </Box>
      <Box sx={{ p: 3, bgcolor: "background.paper", borderRadius: 2, boxShadow: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        <TextField label="Entry Title" defaultValue={`Entry ${id} Title`} fullWidth />
        <TextField label="Description" defaultValue="Some description here..." multiline rows={4} fullWidth />
        <Button variant="contained" startIcon={<Save />} sx={{ alignSelf: "flex-start" }}>
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
