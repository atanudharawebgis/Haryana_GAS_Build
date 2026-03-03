import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Menu,
  Divider,
} from "@mui/material";
import {
  Home as HomeIcon,
  TrendingUp,
  People,
  Assessment,
  LocationOn,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";

function Dashboard({ onBackToHome, onNavigateToMap }) {
  const [anchorEl, setAnchorEl] = useState(null);
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
      <AppBar
        position="static"
        sx={{
          bgcolor: "#003376",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          flexShrink: 0,
        }}
      >
        <Toolbar sx={{ minHeight: "60px !important", px: 2 }}>
          {/* ADD BACK BUTTON - START */}
          {/* <IconButton
            onClick={onBackToHome}
            sx={{
              color: "white",
              mr: 1,
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            <HomeIcon />
          </IconButton> */}
          {/* ADD BACK BUTTON - END */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#f6f9f6ff" }}
            >
              Haryana Gas
            </Typography>
            <Divider
              orientation="vertical"
              flexItem
              sx={{ mx: 2, borderColor: "white" }}
            />
            <Typography variant="body2" sx={{ color: "#fefbfbff" }}>
              City Gas Distribution
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              size="small"
              sx={{ border: "1px solid #fcfcfcff", color: "white" }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onBackToHome();
                }}
              >
                Home
              </MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  onNavigateToMap();
                }}
              >
                Map
              </MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Dashboard Content */}
      <Box sx={{ flex: 1, p: 3, overflow: "auto" }}>
        <Grid container spacing={3}>
          {/* Card 1 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "#e3f2fd" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: "#1976d2" }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      1,234
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Connections
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "#f3e5f5" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <People sx={{ fontSize: 40, color: "#7b1fa2" }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      567
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Users
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "#e8f5e9" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <LocationOn sx={{ fontSize: 40, color: "#388e3c" }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      89
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Service Areas
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4 */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: "#fff3e0" }}>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: "#f57c00" }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: "bold" }}>
                      45
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reports Generated
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Large Chart Card */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
                  Monthly Statistics
                </Typography>
                <Box
                  sx={{
                    height: 300,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "#f5f5f5",
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="h6" color="text.secondary">
                    Chart will be displayed here
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
export default React.memo(Dashboard);
// export default Dashboard;
