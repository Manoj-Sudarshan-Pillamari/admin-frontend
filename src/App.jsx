import { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Container,
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
  Checkbox,
  FormControlLabel,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TableSortLabel,
  Switch,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CloudUpload,
  Close,
  Crop,
} from "@mui/icons-material";
import { TYPE_OPTIONS } from "./constant.js";

const API_URL = import.meta.env.VITE_API_URL;

const columnNames = [
  { id: "index", label: "#", sortable: false },
  { id: "media", label: "Image", sortable: false },
  { id: "brandName", label: "Brand Name", sortable: true },
  { id: "type", label: "Type", sortable: true },
  { id: "tile", label: "Tile", sortable: true },
  { id: "rank", label: "Rank", sortable: true },
  { id: "priority", label: "Priority", sortable: true },
  { id: "autoplaySpeed", label: "Speed (ms)", sortable: true },
  { id: "startDateTime", label: "Start Date", sortable: true },
  { id: "endDateTime", label: "End Date", sortable: true },
  { id: "status", label: "Status", sortable: true },
  { id: "link", label: "Link", sortable: false },
  { id: "actions", label: "Actions", sortable: false },
];

const TILE_OPTIONS = Array.from({ length: 28 }, (_, i) => i + 1);

const formatDateTimeLocal = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const formatDisplayDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const isCurrentlyLive = (startDateTime, endDateTime) => {
  const now = new Date();
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);
  return now >= start && now <= end;
};

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

function App() {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [formData, setFormData] = useState({
    brandName: "",
    description: "",
    type: "",
    tile: "",
    rank: "",
    priority: false,
    autoplaySpeed: 3000,
    link: "",
    startDateTime: "",
    endDateTime: "",
    status: "active",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");
  const [togglingStatus, setTogglingStatus] = useState(null);

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

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setContentList(res?.data?.data);
    } catch (err) {
      showSnackbar("Failed to fetch contentList", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const showSnackbar = (message, type = "success") => {
    setSnackbar({ open: true, message, type });
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenAdd = () => {
    setFormData({
      brandName: "",
      description: "",
      type: "",
      tile: "",
      rank: "",
      priority: false,
      autoplaySpeed: 3000,
      link: "",
      startDateTime: "",
      endDateTime: "",
      status: "active",
    });
    setFile(null);
    setPreview(null);
    setSelectedId(null);
    setEditDialog(true);
  };

  const handleOpenEdit = (brand) => {
    setFormData({
      brandName: brand?.brandName,
      description: brand?.description,
      type: brand?.type || "",
      tile: brand?.tile,
      rank: brand?.rank,
      priority: brand?.priority,
      autoplaySpeed: brand?.autoplaySpeed || 3000,
      link: brand?.link || "",
      startDateTime: formatDateTimeLocal(brand?.startDateTime),
      endDateTime: formatDateTimeLocal(brand?.endDateTime),
      status: brand?.status || "active",
    });
    setFile(null);
    setPreview(brand?.media?.url || null);
    setSelectedId(brand?._id);
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

  const handlePriorityChange = (e) => {
    const checked = e?.target?.checked;
    setFormData({
      ...formData,
      priority: checked,
      rank: checked ? "" : 0,
    });
  };

  // const handleToggleStatus = async (id) => {
  //   setTogglingStatus(id);
  //   try {
  //     const res = await axios.patch(`${API_URL}/${id}/toggle-status`);
  //     showSnackbar(res?.data?.message, "success");
  //     fetchBrands();
  //   } catch (err) {
  //     showSnackbar("Failed to toggle status", "error");
  //   } finally {
  //     setTogglingStatus(null);
  //   }
  // };

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
    if (!formData?.priority) return false;

    const duplicate = contentList?.find(
      (brand) =>
        brand?._id !== selectedId &&
        brand?.tile === Number(formData?.tile) &&
        brand?.rank === Number(formData?.rank) &&
        brand?.priority === true
    );

    return duplicate;
  };

  const handleSubmit = async () => {
    if (
      !formData?.brandName ||
      !formData?.description ||
      !formData?.tile ||
      !formData?.link
    ) {
      showSnackbar(
        "Brand Name, Description, Tile and Link are required",
        "error"
      );
      return;
    }

    if (!formData?.startDateTime || !formData?.endDateTime) {
      showSnackbar("Start date-time and End date-time are required", "error");
      return;
    }

    const startDate = new Date(formData?.startDateTime);
    const endDate = new Date(formData?.endDateTime);

    if (endDate <= startDate) {
      showSnackbar("End date-time must be after start date-time", "error");
      return;
    }

    if (formData?.priority && !formData?.rank) {
      showSnackbar("Rank is required when priority is enabled", "error");
      return;
    }

    if (!selectedId && !file) {
      showSnackbar("Please upload an image", "error");
      return;
    }

    if (!formData?.autoplaySpeed || formData?.autoplaySpeed < 1000) {
      showSnackbar("Autoplay speed must be at least 1000ms", "error");
      return;
    }

    if (formData?.autoplaySpeed > 30000) {
      showSnackbar("Autoplay speed cannot exceed 30000ms", "error");
      return;
    }

    const duplicate = isDuplicateRank();
    if (duplicate) {
      showSnackbar(
        `Rank ${formData?.rank} already exists in Tile ${formData?.tile} with priority. Please provide a unique rank value.`,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();
      data.append("brandName", formData?.brandName);
      data.append("description", formData?.description);
      data.append("type", formData?.type || "");
      data.append("tile", formData?.tile);
      data.append("rank", formData?.priority ? formData?.rank : 0);
      data.append("priority", formData?.priority);
      data.append("autoplaySpeed", formData?.autoplaySpeed);
      data.append("link", formData?.link);
      data.append("startDateTime", formData?.startDateTime);
      data.append("endDateTime", formData?.endDateTime);
      data.append("status", formData?.status);
      if (file) data.append("media", file);

      if (selectedId) {
        await axios.put(`${API_URL}/${selectedId}`, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar("Brand updated successfully!", "success");
      } else {
        await axios.post(API_URL, data, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSnackbar("Brand added successfully!", "success");
      }
      handleClose();
      fetchBrands();
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
      showSnackbar("Brand deleted successfully!", "success");
      fetchBrands();
      handleCloseDeleteDialog();
    } catch (err) {
      showSnackbar("Failed to delete brand", "error");
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

      if (orderBy === "startDateTime" || orderBy === "endDateTime") {
        aValue = new Date(aValue).getTime() || 0;
        bValue = new Date(bValue).getTime() || 0;
      }

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return order === "asc" ? -1 : 1;
      if (aValue > bValue) return order === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedContentList = getSortedData();

  const getStatusInfo = (brand) => {
    if (brand?.status === "inactive") {
      return { label: "Inactive", color: "default" };
    }
    const live = isCurrentlyLive(brand?.startDateTime, brand?.endDateTime);
    if (live) {
      return { label: "Live", color: "success" };
    }
    const now = new Date();
    if (new Date(brand?.startDateTime) > now) {
      return { label: "Scheduled", color: "info" };
    }
    return { label: "Expired", color: "warning" };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Premium Brands Admin UI
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{ mb: 2 }}
        >
          Add New Content
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
                  <TableCell colSpan={13} align="center" sx={{ py: 4 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                sortedContentList?.map((brand, index) => {
                  const statusInfo = getStatusInfo(brand);
                  return (
                    <TableRow
                      key={brand?._id}
                      hover
                      sx={{
                        padding: 0,
                        margin: 0,
                        opacity: brand?.status === "inactive" ? 0.6 : 1,
                      }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {brand?.media?.url && (
                          <Box
                            component="img"
                            src={brand?.media?.url}
                            alt={brand?.brandName}
                            sx={{ width: 50, height: 50, borderRadius: 1 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>{brand?.brandName}</TableCell>
                      <TableCell>{brand?.type || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={`Tile - ${brand?.tile}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{brand?.rank}</TableCell>
                      <TableCell>
                        <Chip
                          label={brand?.priority ? "Yes" : "No"}
                          color={brand?.priority ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{brand?.autoplaySpeed || 3000}ms</TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDisplayDate(brand?.startDateTime)}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDisplayDate(brand?.endDateTime)}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <Chip
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={brand?.link}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 100,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              cursor: "pointer",
                              color: "#1976d2",
                            }}
                            onClick={() => window.open(brand?.link, "_blank")}
                          >
                            {brand?.link}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleOpenEdit(brand)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleOpenDeleteDialog(brand?._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
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
          {selectedId ? "Edit Details" : "Add New Brand"}
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Premium Brand Name"
            name="brandName"
            value={formData?.brandName}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData?.description}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
            multiline
            rows={3}
          />
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Industry Type (Optional)</InputLabel>
            <Select
              name="type"
              value={formData?.type}
              onChange={handleChange}
              label="Industry Type (Optional)"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {TYPE_OPTIONS?.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense" size="small" required>
            <InputLabel>Tile Number</InputLabel>
            <Select
              name="tile"
              value={formData?.tile}
              onChange={handleChange}
              label="Tile Number"
            >
              {TILE_OPTIONS?.map((num) => (
                <MenuItem key={num} value={num}>
                  Tile {num}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 1,
            }}
          >
            <TextField
              fullWidth
              label="Start Date & Time"
              name="startDateTime"
              type="datetime-local"
              value={formData?.startDateTime}
              onChange={handleChange}
              required
              margin="dense"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date & Time"
              name="endDateTime"
              type="datetime-local"
              value={formData?.endDateTime}
              onChange={handleChange}
              required
              margin="dense"
              size="small"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: formData?.startDateTime || undefined,
              }}
            />
          </Box>
          {formData?.startDateTime &&
            formData?.endDateTime &&
            new Date(formData?.endDateTime) <=
              new Date(formData?.startDateTime) && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.5, display: "block" }}
              >
                ⚠ End date-time must be after start date-time
              </Typography>
            )}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              mt: 2,
              p: 1.5,
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              backgroundColor: "#fafafa",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Status:
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={formData?.status === "active"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.checked ? "active" : "inactive",
                    })
                  }
                  color="success"
                />
              }
              label={
                <Chip
                  label={formData?.status === "active" ? "Active" : "Inactive"}
                  color={formData?.status === "active" ? "success" : "default"}
                  size="small"
                  variant="outlined"
                />
              }
            />
          </Box>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData?.priority}
                onChange={handlePriorityChange}
              />
            }
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                Priority
              </Box>
            }
            sx={{ mt: 1 }}
          />
          <TextField
            fullWidth
            label="Rank"
            name="rank"
            value={formData?.priority ? formData?.rank : 0}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
            type="number"
            inputProps={{ min: 1 }}
            disabled={!formData?.priority}
          />
          <TextField
            fullWidth
            label="Autoplay Speed (ms)"
            name="autoplaySpeed"
            value={formData?.autoplaySpeed}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
            type="number"
            inputProps={{ min: 1000, max: 30000, step: 500 }}
            helperText="Min: 1000ms | Max: 30000ms | Default: 3000ms"
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
                Upload Image
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
          Are you sure you want to delete the record?
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
    </Container>
  );
}

export default App;
