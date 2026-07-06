import { PlayArrow } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import { useRef, useState } from "react";

interface ColorPalette {
  PRIMARY: string;
  TEXT_PRIMARY: string;
  BORDER: string;
}

interface InnovationVideoPlayerProps {
  videoId: string | null;
  colors: ColorPalette;
}

export default function InnovationVideoPlayer({
  videoId,
  colors,
}: InnovationVideoPlayerProps) {
  if (!videoId) return null;

  return (
    <Box sx={{ mb: 5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
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
          Innovation Video
        </Typography>
      </Box>

      <Box
        sx={{
          width: "100%",
          aspectRatio: "16/9",
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.1)",
          border: `1px solid ${colors.BORDER}`,
        }}
      >
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </Box>
    </Box>
  );
}

export const VideoPlayerRenderer = ({ urlStr }: { urlStr: string }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);

    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 600,
        height: 340,
        borderRadius: 3,
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid rgba(0,0,0,0.1)",
        bgcolor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0 10px 40px rgba(0,0,0,0.1)",
      }}
    >
      <video
        ref={videoRef}
        src={urlStr}
        controls={isPlaying}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
        preload="metadata"
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      />

      {!isPlaying && (
        <Box
          onClick={handlePlay}
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "rgba(0,0,0,0.3)",
            cursor: "pointer",
            "&:hover .play-icon": {
              transform: "scale(1.1)",
              color: "#fff",
            },
          }}
        >
          <PlayArrow
            className="play-icon"
            sx={{
              fontSize: 64,
              color: "rgba(255,255,255,0.8)",
              transition: "all 0.2s ease",
            }}
          />
        </Box>
      )}
    </Box>
  );
};