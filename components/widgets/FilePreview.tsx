import React, { useState, useEffect } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const FilePreview = ({ fileVal, onClear, label, previewUrl }: { fileVal: any, onClear: () => void, label?: string, previewUrl?: string }) => {
  const [url, setUrl] = useState<string>("");
  const [isImage, setIsImage] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

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
    <Box sx={{ position: "relative", display: "inline-block", mt: 2 }}>
      <IconButton
        size="small"
        onClick={onClear}
        sx={{
          position: "absolute",
          top: -12,
          right: -12,
          bgcolor: "background.paper",
          boxShadow: 1,
          "&:hover": { bgcolor: "background.paper" },
          zIndex: 1,
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      {isImage ? (
        <Box sx={{ width: 260, height: 160, borderRadius: 2, overflow: 'hidden', bgcolor: 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src={url} alt={label || "Preview"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Box>
      ) : isVideo ? (
        <Box sx={{ width: 260, height: 160, borderRadius: 2, overflow: 'hidden', bgcolor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video src={url} controls style={{ width: "100%", height: "100%", objectFit: "contain" }} />
        </Box>
      ) : (
        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
          Selected: {typeof fileVal === "string" ? fileVal.split("/").pop() : (fileVal as File)?.name}
        </Typography>
      )}
    </Box>
  );
};
