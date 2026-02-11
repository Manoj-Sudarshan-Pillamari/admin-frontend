import { useState, useEffect } from "react";
import axios from "axios";
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
} from "@mui/material";
import { Add, Edit, Delete, CloudUpload, Close } from "@mui/icons-material";

const API_URL = import.meta.env.VITE_API_URL;
const columnNames = [
  "#",
  "Image",
  "Brand Name",
  "Type",
  "Rank",
  "Priority",
  "Actions",
];

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
    rank: "",
    priority: false,
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

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
      rank: "",
      priority: false,
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
      type: brand?.type,
      rank: brand?.rank,
      priority: brand?.priority,
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

  const handleFileChange = (e) => {
    const selected = e?.target?.files[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(selected);
    }
  };

  const isDuplicateRank = () => {
    if (!formData?.priority) return false;

    const duplicate = contentList?.find(
      (brand) =>
        brand?._id !== selectedId &&
        brand?.type?.toLowerCase() === formData?.type?.toLowerCase() &&
        brand?.rank === Number(formData?.rank) &&
        brand?.priority === true
    );

    return duplicate;
  };

  const handleSubmit = async () => {
    if (!formData?.brandName || !formData?.description || !formData?.type) {
      showSnackbar("All fields are required", "error");
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

    const duplicate = isDuplicateRank();
    if (duplicate) {
      showSnackbar(
        `Rank ${formData?.rank} already exists in "${formData?.type}". Please provide a unique rank value.`,
        "error"
      );
      return;
    }

    setSaving(true);

    try {
      const data = new FormData();
      data?.append("brandName", formData?.brandName);
      data?.append("description", formData?.description);
      data?.append("type", formData?.type);
      data?.append("rank", formData?.priority ? formData?.rank : 0);
      data?.append("priority", formData?.priority);
      if (file) data?.append("media", file);

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#1d1f21" }}>
                {columnNames?.map((header) => (
                  <TableCell
                    key={header}
                    sx={{ color: "#fff", fontWeight: "bold" }}
                  >
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {contentList?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                contentList?.map((brand, index) => (
                  <TableRow
                    key={brand?._id}
                    hover
                    sx={{
                      padding: 0,
                      margin: 0,
                    }}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {brand?.media?.url && (
                        <Box
                          component="img"
                          src={brand?.media?.url}
                          alt={brand?.brandName}
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 1,
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>{brand?.brandName}</TableCell>
                    <TableCell>{brand?.type}</TableCell>
                    <TableCell>{brand?.rank}</TableCell>
                    <TableCell>
                      <Chip
                        label={brand?.priority ? "Yes" : "No"}
                        color={brand?.priority ? "success" : "default"}
                        size="small"
                      />
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
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={editDialog}
        onClose={handleClose}
        maxWidth="sm"
        sx={{ overflowY: "hidden" }}
      >
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
          <TextField
            fullWidth
            label="Type"
            name="type"
            value={formData?.type}
            onChange={handleChange}
            required
            margin="dense"
            size="small"
          />
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
            // helperText={
            //   !formData?.priority
            //     ? "Enable priority to set rank"
            //     : "Rank must be unique within same type"
            // }
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
                  sx={{ maxHeight: 150, maxWidth: "100%", borderRadius: 1 }}
                />
                <br />
                <Button
                  size="small"
                  color="error"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  sx={{ mt: 1 }}
                >
                  Remove
                </Button>
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
        open={deleteDialog}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        sx={{ overflowY: "hidden", fontFamily: "Roboto, sans-serif" }}
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
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.type}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;
