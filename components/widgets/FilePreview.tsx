import CloseIcon from '@mui/icons-material/Close';
import { Box, Dialog, IconButton, Typography } from '@mui/material';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export const FilePreview = ({ fileVal, onClear, label, previewUrl }: { fileVal: unknown, onClear: () => void, label?: string, previewUrl?: string }) => {
  const [openModal, setOpenModal] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string>("");

  useEffect(() => {
    if (fileVal instanceof File) {
      const newUrl = URL.createObjectURL(fileVal);
      Promise.resolve().then(() => setObjectUrl(newUrl));
      return () => URL.revokeObjectURL(newUrl);
    }
  }, [fileVal]);

  if (!fileVal) return null;

  let url = "";
  let isImage = false;
  let isVideo = false;

  if (typeof fileVal === "string") {
    url = previewUrl || fileVal;
    const urlWithoutQuery = url.split('?')[0];
    const ext = urlWithoutQuery.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      isImage = true;
    } else if (["mp4", "webm", "ogg", "mov", "mkv", "avi"].includes(ext)) {
      isVideo = true;
    } else {
      isImage = true;
    }
  } else if (fileVal instanceof File) {
    url = objectUrl;
    isImage = fileVal.type.startsWith("image/");
    isVideo = fileVal.type.startsWith("video/");
  }

  // Prevent rendering if URL isn't ready for a File
  if (fileVal instanceof File && !url) return null;

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
              border: '1px solid #e2e8f0',
              position: 'relative'
            }}
          >
            <Image src={url} alt={label || "Preview"} fill style={{ objectFit: "cover" }} unoptimized />
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
            <Box sx={{ position: 'relative', width: '80vw', height: '80vh' }}>
              <Image src={url} alt="Full Preview" fill style={{ objectFit: 'contain', borderRadius: '8px' }} unoptimized />
            </Box>
          ) : isVideo ? (
             <video src={url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} />
          ) : null}
        </Box>
      </Dialog>
    </>
  );
};
