import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  InputAdornment,
  TablePagination,
  Collapse,
  Avatar,
} from "@mui/material";
import {
  Home as HomeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  PersonAdd as PersonAddIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";

function UserManagement({ onBackToHome }) {
  const [users, setUsers] = useState([
    {
      id: 1,
      employeeId: "HG001",
      name: "Rajesh Kumar",
      email: "rajesh.kumar@mapgeoid.com",
      role: "Admin",
      status: "Active",
      department: "Operations",
      photo: "",
    },
    {
      id: 2,
      employeeId: "HG002",
      name: "Priya Sharma",
      email: "priya.sharma@mapgeoid.com",
      role: "Manager",
      status: "Active",
      department: "Technical",
      photo: "",
    },
    {
      id: 3,
      employeeId: "HG003",
      name: "Amit Singh",
      email: "amit.singh@mapgeoid.com",
      role: "User",
      status: "Inactive",
      department: "Sales",
      photo: "",
    },
    {
      id: 4,
      employeeId: "HG004",
      name: "Neha Gupta",
      email: "neha.gupta@mapgeoid.com",
      role: "User",
      status: "Active",
      department: "Support",
      photo: "",
    },
    {
      id: 5,
      employeeId: "HG005",
      name: "Vikram Yadav",
      email: "vikram.yadav@mapgeoid.com",
      role: "Manager",
      status: "Active",
      department: "Operations",
      photo: "",
    },
    {
      id: 6,
      employeeId: "HG006",
      name: "Suman Verma",
      email: "suman.verma@mapgeoid.com",
      role: "User",
      status: "Active",
      department: "Technical",
      photo: "",
    },
    {
      id: 7,
      employeeId: "HG007",
      name: "Rahul Malhotra",
      email: "rahul.malhotra@mapgeoid.com",
      role: "Manager",
      status: "Active",
      department: "Sales",
      photo: "",
    },
    {
      id: 8,
      employeeId: "HG008",
      name: "Kavita Rani",
      email: "kavita.rani@mapgeoid.com",
      role: "User",
      status: "Inactive",
      department: "Support",
      photo: "",
    },
    {
      id: 9,
      employeeId: "HG009",
      name: "Deepak Chauhan",
      email: "deepak.chauhan@mapgeoid.com",
      role: "Admin",
      status: "Active",
      department: "Operations",
      photo: "",
    },
    {
      id: 10,
      employeeId: "HG010",
      name: "Anjali Kapoor",
      email: "anjali.kapoor@mapgeoid.com",
      role: "User",
      status: "Active",
      department: "Technical",
      photo: "",
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id: null,
    employeeId: "",
    name: "",
    email: "",
    role: "User",
    status: "Active",
    department: "",
    photo: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    department: "",
  });

  const handleAddUser = () => {
    setEditMode(false);
    setCurrentUser({
      id: null,
      employeeId: "",
      name: "",
      email: "",
      role: "User",
      status: "Active",
      department: "",
      photo: "",
    });
    setOpenDialog(true);
  };

  const handleEditUser = (user) => {
    setEditMode(true);
    setCurrentUser(user);
    setOpenDialog(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setUsers(users.filter((user) => user.id !== userId));
      setPage(0);
    }
  };

  const handleSaveUser = () => {
    if (editMode) {
      setUsers(
        users.map((user) => (user.id === currentUser.id ? currentUser : user)),
      );
    } else {
      const newUser = {
        ...currentUser,
        id: Math.max(...users.map((u) => u.id)) + 1,
      };
      setUsers([...users, newUser]);
    }
    setOpenDialog(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters({ ...filters, [filterName]: value });
    setPage(0);
  };

  const clearFilters = () => {
    setFilters({
      role: "",
      status: "",
      department: "",
    });
    setPage(0);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filters.role === "" || user.role === filters.role;
    const matchesStatus =
      filters.status === "" || user.status === filters.status;
    const matchesDepartment =
      filters.department === "" || user.department === filters.department;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const paginatedUsers = filteredUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const getRoleColor = (role) => {
    switch (role) {
      case "Admin":
        return "error";
      case "Manager":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    return status === "Active" ? "success" : "default";
  };

  const uniqueDepartments = [...new Set(users.map((u) => u.department))];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: "#f5f5f5",
      }}
    >
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: "#003376" }}>
        <Toolbar>
          <IconButton
            onClick={onBackToHome}
            sx={{
              color: "white",
              mr: 2,
              "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
            }}
          >
            <HomeIcon />
          </IconButton>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "white" }}>
            User Management - mapgeoid Gas
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
              <TextField
                placeholder="Search users..."
                size="small"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FilterListIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  borderColor: "#003376",
                  color: "#003376",
                  "&:hover": {
                    borderColor: "#002855",
                    bgcolor: "rgba(0, 51, 118, 0.04)",
                  },
                }}
              >
                Filters
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddUser}
                sx={{
                  bgcolor: "#4caf50",
                  "&:hover": { bgcolor: "#45a049" },
                }}
              >
                Add User
              </Button>
            </Box>

            {/* Collapsible Filters */}
            <Collapse in={showFilters}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  pt: 2,
                  borderTop: "1px solid #e0e0e0",
                }}
              >
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={filters.role}
                    label="Role"
                    onChange={(e) => handleFilterChange("role", e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="User">User</MenuItem>
                    <MenuItem value="Manager">Manager</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={filters.department}
                    label="Department"
                    onChange={(e) =>
                      handleFilterChange("department", e.target.value)
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    {uniqueDepartments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="text"
                  onClick={clearFilters}
                  sx={{ color: "#d32f2f" }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Collapse>
          </Box>
        </Card>

        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Employee ID</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }} align="center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      sx={{ "&:hover": { bgcolor: "#f9f9f9" } }}
                    >
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.employeeId}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Avatar
                            src={user.photo}
                            alt={user.name}
                            sx={{ width: 32, height: 32 }}
                          >
                            {user.name.charAt(0)}
                          </Avatar>
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status}
                          color={getStatusColor(user.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setViewDialogOpen(true);
                          }}
                          sx={{ color: "#4caf50" }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                          sx={{ color: "#1976d2" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.id)}
                          sx={{ color: "#d32f2f" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredUsers.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="Rows per page:"
            sx={{
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "center",
              ".MuiTablePagination-toolbar": {
                justifyContent: "center",
              },
              ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows":
                {
                  margin: 0,
                },
            }}
          />
        </Card>
      </Box>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PersonAddIcon />
            {editMode ? "Edit User" : "Add New User"}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              label="Employee ID"
              fullWidth
              value={currentUser.employeeId}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, employeeId: e.target.value })
              }
              required
              placeholder="e.g., HG001"
            />
            <TextField
              label="Name"
              fullWidth
              value={currentUser.name}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, name: e.target.value })
              }
              required
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={currentUser.email}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, email: e.target.value })
              }
              required
            />
            <TextField
              label="Department"
              fullWidth
              value={currentUser.department}
              onChange={(e) =>
                setCurrentUser({ ...currentUser, department: e.target.value })
              }
              required
            />
            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Photo
              </Typography>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                  fullWidth
                  size="small"
                  value={currentUser.photo}
                  onChange={(e) =>
                    setCurrentUser({ ...currentUser, photo: e.target.value })
                  }
                  placeholder="Enter photo URL or browse file"
                />
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ whiteSpace: "nowrap" }}
                >
                  Browse
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setCurrentUser({
                            ...currentUser,
                            photo: reader.result,
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </Button>
              </Box>
              {currentUser.photo && (
                <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
                  <Avatar
                    src={currentUser.photo}
                    alt="Preview"
                    sx={{ width: 80, height: 80 }}
                  >
                    {currentUser.name.charAt(0)}
                  </Avatar>
                </Box>
              )}
            </Box>
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={currentUser.role}
                label="Role"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, role: e.target.value })
                }
              >
                <MenuItem value="User">User</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={currentUser.status}
                label="Status"
                onChange={(e) =>
                  setCurrentUser({ ...currentUser, status: e.target.value })
                }
              >
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{
              bgcolor: "#4caf50",
              "&:hover": { bgcolor: "#45a049" },
            }}
            disabled={
              !currentUser.name ||
              !currentUser.email ||
              !currentUser.department ||
              !currentUser.employeeId // YE ADD KARO
            }
          >
            {editMode ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
      {/* View User Details Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            User Details
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                <Avatar
                  src={selectedUser.photo}
                  alt={selectedUser.name}
                  sx={{ width: 120, height: 120, fontSize: 48 }}
                >
                  {selectedUser.name.charAt(0)}
                </Avatar>
              </Box>
              <Box sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1 }}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>ID:</strong> {selectedUser.id}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Employee ID:</strong> {selectedUser.employeeId}{" "}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Name:</strong> {selectedUser.name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {selectedUser.email}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Department:</strong> {selectedUser.department}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  <strong>Role:</strong>{" "}
                  <Chip
                    label={selectedUser.role}
                    color={getRoleColor(selectedUser.role)}
                    size="small"
                  />
                </Typography>
                <Typography variant="body1">
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={selectedUser.status}
                    color={getStatusColor(selectedUser.status)}
                    size="small"
                  />
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setViewDialogOpen(false)}
            variant="contained"
            sx={{ bgcolor: "#003376", "&:hover": { bgcolor: "#002855" } }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
