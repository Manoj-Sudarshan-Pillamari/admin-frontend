import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Box,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  TableSortLabel,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CloudUpload,
  Close,
  Crop,
} from "@mui/icons-material";
import MediaPreview from "./component/MediaPreview";

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/pip-videos`;

const columnNames = [
  { id: "index", label: "#", sortable: false },
  { id: "media", label: "Media", sortable: false },
  { id: "link", label: "Link", sortable: false },
  { id: "rank", label: "Rank", sortable: true },
  { id: "actions", label: "Actions", sortable: false },
];

const getCroppedImg = (image, crop) => {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = crop.width * scaleX;
  canvas.height = crop.height * scaleY;

  const ctx = canvas.getContext("2d");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width * scaleX,
    crop.height * scaleY
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, "image/jpeg");
  });
};

function VideoPlayer() {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [formData, setFormData] = useState({
    link: "",
    rank: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");

  const [cropDialog, setCropDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({
    unit: "%",
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [originalFileName, setOriginalFileName] = useState("");
  const imgRef = useRef(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setContentList(res?.data?.data);
    } catch (err) {
      showSnackbar("Failed to fetch videos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleMediaPreview = (item) => {
    setPreviewMedia({
      url: item?.media?.url,
      type: item?.media?.type,
      title: `Rank ${item?.rank}`,
    });
  };

  const handleClosePreview = () => {
    setPreviewMedia(null);
  };

  const handleOpenAdd = () => {
    setFormData({ link: "", rank: "" });
    setFile(null);
    setPreview(null);
    setSelectedId(null);
    setEditDialog(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      link: item?.link || "",
      rank: item?.rank || "",
    });
    setFile(null);
    setPreview(item?.media?.url || null);
    setSelectedId(item?._id);
    setEditDialog(true);
  };

  const handleClose = () => {
    setEditDialog(false);
    setSelectedId(null);
    setFile(null);
    setPreview(null);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialog(false);
    setSelectedId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e?.target?.name]: e?.target?.value });
  };

  const handleFileChange = (e) => {
    const selected = e?.target?.files[0];
    if (selected) {
      if (
        selected?.type?.startsWith("image/") &&
        selected?.type !== "image/gif"
      ) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageSrc(reader.result);
          setOriginalFileName(selected.name);
          setCrop({ unit: "%", x: 25, y: 25, width: 50, height: 50 });
          setCompletedCrop(null);
          setCropDialog(true);
        };
        reader.readAsDataURL(selected);
      } else {
        setFile(selected);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(selected);
      }
    }
    e.target.value = "";
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.5;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    setCrop({ unit: "px", x, y, width: size, height: size });
  };

  const handleCropConfirm = async () => {
    if (!imgRef.current || !completedCrop) {
      showSnackbar("Please select a crop area", "error");
      return;
    }

    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const croppedFile = new File(
        [croppedBlob],
        originalFileName || "cropped-image.jpg",
        { type: "image/jpeg" }
      );
      setFile(croppedFile);
      setPreview(URL.createObjectURL(croppedBlob));
      setCropDialog(false);
      setImageSrc(null);
    } catch (err) {
      showSnackbar("Failed to crop image", "error");
    }
  };

  const handleSkipCrop = () => {
    fetch(imageSrc)
      .then((res) => res.blob())
      .then((blob) => {
        const originalFile = new File([blob], originalFileName || "image.jpg", {
          type: blob.type,
        });
        setFile(originalFile);
        setPreview(imageSrc);
        setCropDialog(false);
        setImageSrc(null);
      });
  };

  const handleCropDialogClose = () => {
    setCropDialog(false);
    setImageSrc(null);
  };

  const isDuplicateRank = () => {
    const duplicate = contentList?.find(
      (item) =>
        item?._id !== selectedId && item?.rank === Number(formData?.rank)
    );
    return duplicate;
  };

  const handleSubmit = async () => {
    if (!formData?.link) {
      showSnackbar("Link is required", "error");
      return;
    }

    if (!formData?.rank || Number(formData?.rank) < 1) {
      showSnackbar("Rank is required and must be at least 1", "error");
      return;
    }

    if (!selectedId && !file) {
      showSnackbar("Please upload a media file", "error");
      return;
    }

    const duplicate = isDuplicateRank();
    if (duplicate) {
      showSnackbar(
        `Rank ${formData?.rank} is already assigned to another video. Please use a unique rank.`,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();
      data.append("link", formData?.link);
      data.append("rank", formData?.rank);
      if (file) data.append("media", file);

      if (selectedId) {
        await axios.put(`${API_URL}/${selectedId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar("Video updated successfully!", "success");
      } else {
        await axios.post(API_URL, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar("Video added successfully!", "success");
      }
      handleClose();
      fetchVideos();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || "Something went wrong",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (id) => {
    setDeleteDialog(true);
    setSelectedId(id);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_URL}/${selectedId}`);
      showSnackbar("Video deleted successfully!", "success");
      fetchVideos();
      handleCloseDeleteDialog();
    } catch (err) {
      showSnackbar("Failed to delete video", "error");
    }
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const getSortedData = () => {
    if (!orderBy) return contentList;

    return [...contentList].sort((a, b) => {
      let aValue = a[orderBy];
      let bValue = b[orderBy];

      if (aValue === null || aValue === undefined) aValue = "";
      if (bValue === null || bValue === undefined) bValue = "";

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedContentList = getSortedData();

  const renderMediaPreview = (item) => {
    if (!item?.media?.url) return null;

    if (item?.media?.type === "video") {
      return (
        <Box
          component="video"
          src={item?.media?.url}
          sx={{ width: 50, height: 50, borderRadius: 1, objectFit: "cover" }}
          muted
        />
      );
    }

    return (
      <Box
        component="img"
        src={item?.media?.url}
        alt="Media"
        sx={{ width: 50, height: 50, borderRadius: 1, objectFit: "cover" }}
      />
    );
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          mb: 2,
        }}
      >
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenAdd}>
          Add New Video
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "70vh",
            overflowX: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#5472e9 #dedede",
          }}
        >
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {columnNames?.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{
                      backgroundColor: "#1d1f21",
                      color: "#fff",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {column?.sortable ? (
                      <TableSortLabel
                        active={orderBy === column?.id}
                        direction={orderBy === column?.id ? order : "asc"}
                        onClick={() => handleRequestSort(column?.id)}
                        sx={{
                          color: "#fff !important",
                          "&:hover": { color: "#fff !important" },
                          "& .MuiTableSortLabel-icon": {
                            color: "#fff !important",
                          },
                          "&.Mui-active": {
                            color: "#fff !important",
                            "& .MuiTableSortLabel-icon": {
                              color: "#fff !important",
                            },
                          },
                        }}
                      >
                        {column?.label}
                      </TableSortLabel>
                    ) : (
                      column?.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedContentList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                sortedContentList?.map((item, index) => (
                  <TableRow key={item?._id} hover>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {item?.media?.url && (
                        <Tooltip title="Click to preview">
                          <Box
                            onClick={() => handleMediaPreview(item)}
                            sx={{
                              width: 50,
                              height: 50,
                              borderRadius: 1,
                              backgroundColor: "#f1f5f9",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              overflow: "hidden",
                              border: "1px solid #e2e8f0",
                              transition:
                                "transform 0.2s ease, box-shadow 0.2s ease",
                              "&:hover": {
                                transform: "scale(1.1)",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                              },
                            }}
                          >
                            <Box
                              component={
                                item?.media?.type === "video" ? "video" : "img"
                              }
                              src={item?.media?.url}
                              alt="Media"
                              sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                              {...(item?.media?.type === "video"
                                ? { muted: true }
                                : {})}
                            />
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={item?.link}>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 250,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                            color: "#1976d2",
                          }}
                          onClick={() => window.open(item?.link, "_blank")}
                        >
                          {item?.link}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>{item?.rank}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleOpenDeleteDialog(item?._id)}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={editDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {selectedId ? "Edit Video" : "Add New Video"}
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Link"
            name="link"
            value={formData?.link}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
            placeholder="https://example.com"
          />
          <TextField
            fullWidth
            label="Rank"
            name="rank"
            value={formData?.rank}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
            type="number"
            inputProps={{ min: 1 }}
          />
          <Box
            sx={{
              border: "2px dashed #ccc",
              borderRadius: 1,
              p: 2,
              mt: 2,
              textAlign: "center",
            }}
          >
            {preview ? (
              <Box>
                {file?.type?.startsWith("video/") ||
                (preview && preview.includes("video")) ? (
                  <Box
                    component="video"
                    src={preview}
                    controls
                    sx={{
                      maxHeight: 150,
                      maxWidth: "100%",
                      borderRadius: 1,
                    }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={preview}
                    alt="Preview"
                    sx={{
                      maxHeight: 150,
                      maxWidth: "100%",
                      borderRadius: 1,
                    }}
                  />
                )}
                <Box
                  sx={{
                    mt: 1,
                    display: "flex",
                    justifyContent: "center",
                    gap: 1,
                  }}
                >
                  <Button
                    size="small"
                    color="error"
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
                  >
                    Remove
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Crop />}
                    component="label"
                  >
                    Change & Crop
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
              >
                Upload Media
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*,.gif"
                  onChange={handleFileChange}
                />
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={18} /> : null}
          >
            {saving ? "Saving..." : selectedId ? "Update" : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={cropDialog}
        onClose={handleCropDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Crop /> Crop Image
          </Box>
          <IconButton onClick={handleCropDialogClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            bgcolor: "#f5f5f5",
            p: 2,
          }}
        >
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={1}
              style={{ maxHeight: "60vh" }}
            >
              <img
                src={imageSrc}
                alt="Crop"
                onLoad={onImageLoad}
                style={{
                  maxHeight: "60vh",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            </ReactCrop>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ flex: 1, color: "#666", pl: 1 }}>
            Drag corners to resize • Drag inside to move
          </Typography>
          <Button onClick={handleSkipCrop} color="inherit">
            Skip Crop
          </Button>
          <Button variant="contained" onClick={handleCropConfirm}>
            Crop & Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
      >
        <DialogContent sx={{ fontSize: 18 }}>
          Are you sure you want to delete this video?
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDeleteDialog} color="inherit">
            No
          </Button>
          <Button variant="contained" onClick={handleDelete}>
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar?.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar?.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar?.message}
        </Alert>
      </Snackbar>

      <MediaPreview
        open={!!previewMedia}
        onClose={handleClosePreview}
        media={previewMedia}
        title={previewMedia?.title}
      />
    </Box>
  );
}

export default VideoPlayer;
