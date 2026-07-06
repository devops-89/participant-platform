import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export const FilePreview = ({ fileVal, onClear, label, previewUrl }: { fileVal: any, onClear: () => void, label?: string, previewUrl?: string }) => {
  const [url, setUrl] = useState<string>("");
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    let objectUrl = "";
    if (typeof fileVal === "string") {
      objectUrl = previewUrl || fileVal;
      const urlWithoutQuery = objectUrl.split('?')[0];
      const ext = urlWithoutQuery.split(".").pop()?.toLowerCase() || "";
      if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
        setIsImage(true);
        setIsVideo(false);
      } else if (["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)) {
        setIsVideo(true);
        setIsImage(false);
      } else {
        setIsImage(true);
        setIsVideo(false);
      }
      setUrl(objectUrl);
    } else if (fileVal instanceof File) {
      objectUrl = URL.createObjectURL(fileVal);
      setIsImage(fileVal.type.startsWith("image/"));
      setIsVideo(fileVal.type.startsWith("video/"));
      setUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [fileVal]);

  if (!fileVal) return null;

  return (
    <>
      <Box sx={{ position: "relative", display: "inline-block" }}>
        <IconButton
          size="small"
          onClick={onClear}
          sx={{
            position: "absolute",
            top: -10,
            right: -10,
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.paper" },
            zIndex: 1,
            padding: "2px"
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
        {isImage ? (
          <Box 
            onClick={() => setOpenModal(true)}
            sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: 1, 
              overflow: 'hidden', 
              bgcolor: 'rgba(0,0,0,0.04)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid #e2e8f0'
            }}
          >
            <img src={url} alt={label || "Preview"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        ) : isVideo ? (
          <Box 
            onClick={() => setOpenModal(true)}
            sx={{ 
              width: 50, 
              height: 50, 
              borderRadius: 1, 
              overflow: 'hidden', 
              bgcolor: '#000', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              border: '1px solid #e2e8f0'
            }}
          >
            <video src={url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
        ) : (
          <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
            Selected: {typeof fileVal === "string" ? fileVal.split("/").pop() : (fileVal as File)?.name}
          </Typography>
        )}
      </Box>

      {/* Modal for full screen preview */}
      <Dialog 
        open={openModal} 
        onClose={() => setOpenModal(false)}
        maxWidth="md"
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            bgcolor: 'transparent',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }
        }}
      >
        <Box sx={{ position: 'relative', maxWidth: '100%', maxHeight: '90vh' }}>
          <IconButton
            onClick={() => setOpenModal(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              '&:hover': { bgcolor: 'white' },
              zIndex: 2
            }}
          >
            <CloseIcon />
          </IconButton>
          {isImage ? (
            <img src={url} alt="Full Preview" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          ) : isVideo ? (
             <video src={url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          ) : null}
        </Box>
      </Dialog>
    </>
  );
};
