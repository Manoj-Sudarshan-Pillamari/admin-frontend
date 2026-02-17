import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

function MediaPreview({ open, onClose, media, title }) {
  const isVideo = media?.type === "video";
  const isGif = media?.type === "gif";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" noWrap sx={{ maxWidth: "90%" }}>
          {title || "Media Preview"}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#000",
          p: 2,
          minHeight: 300,
        }}
      >
        {isVideo ? (
          <Box
            component="video"
            src={media?.url}
            controls
            autoPlay
            sx={{
              maxWidth: "100%",
              maxHeight: "70vh",
              borderRadius: 1,
            }}
          />
        ) : (
          <Box
            component="img"
            src={media?.url}
            alt={title || "Preview"}
            sx={{
              maxWidth: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              borderRadius: 1,
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

export default MediaPreview;
