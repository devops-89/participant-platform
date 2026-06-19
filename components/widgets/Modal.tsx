import { useModal } from "@/store/useModal";
import { Modal as MuiModal, Box, Backdrop } from "@mui/material";

export default function Modal() {
  const { content, hideModal } = useModal();

  return (
    <MuiModal
      open={Boolean(content)}
      onClose={hideModal}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(5px)",
          },
        },
      }}
      sx={{
        zIndex: 1000,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          bgcolor: "white",
          borderRadius: "20px",
          p: "40px",
          maxHeight: "100%",
          overflowY: "auto",
          backgroundPosition: "50% 50%, 0 0",
          backgroundSize: "3.125rem, auto",
          minWidth: { xs: "300px", sm: "auto" },
          "&::-webkit-scrollbar": {
            width: "5px",
          },
          "&::-webkit-scrollbar-track": {
            borderRadius: "10px",
          },
          "&:focus-visible": {
            outline: "none",
          },
        }}
      >
        {content}
      </Box>
    </MuiModal>
  );
}
