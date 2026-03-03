import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  CircularProgress, // ← ADD THIS
  Alert,
  // InputAdornment,
} from "@mui/material";
import {
  Map,
  Dashboard,
  People,
  Description,
  AccountCircle,
  Stars,
  Close,
  // Visibility,
  // VisibilityOff,
  Person,
  Lock,
  Email,
} from "@mui/icons-material";

// Import logos
import hcgLogo from "./assets/HCG-logo-1.png";
import mapgeoidLogo from "./assets/logo.png";

const NeonNetworkBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById("neon-bg");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const total = 40;

    // Create nodes with random positions
    for (let i = 0; i < total; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid pattern
      ctx.strokeStyle = "rgba(100, 200, 255, 0.15)";
      ctx.lineWidth = 1;

      // Draw connections between nodes
      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i !== j) {
            const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
            if (dist < 200) {
              ctx.globalAlpha = 1 - dist / 200;
              ctx.strokeStyle = "rgba(100, 200, 255, 0.6)";
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        });
      });

      ctx.globalAlpha = 1;

      // Draw nodes with glow effect
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.fillStyle = "#60c5ff";
        ctx.shadowColor = "#60c5ff";
        ctx.shadowBlur = 15;
        ctx.arc(n.x, n.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Update node positions
        n.x += n.vx;
        n.y += n.vy;

        // Bounce off edges
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      requestAnimationFrame(draw);
    }

    draw();

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      id="neon-bg"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
};

const HaryanaGasPortal = ({
  onNavigateToMap,
  onNavigateToDashboard,
  onNavigateToUsers,
}) => {
  const [showLogin, setShowLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // ← ADD
  const [error, setError] = useState(""); // ← ADD
  const [success, setSuccess] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Backend API URL                                    // ← ADD
  const API_URL =
    (process.env.REACT_APP_API_URL || "http://localhost:5000") + "/api";

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Login successful! Redirecting...");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setIsLoggedIn(true);

        setTimeout(() => {
          setShowLogin(false);
          alert(`Welcome, ${data.user.username}!`);
        }, 1000);
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotEmail }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
        setTimeout(() => {
          setShowForgotPassword(false);
          setForgotEmail("");
          setError("");
          setSuccess("");
        }, 3000);
      } else {
        setError(data.message || "Failed to send reset link");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Server error. Please check if backend is running.");
    } finally {
      setLoading(false);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    alert("Logged out successfully!");
  };

  // const handleFeatureClick = (onClick) => {
  //   if (!isLoggedIn) {
  //     setError("Please login first to access this feature");
  //     setShowLogin(true);
  //     return;
  //   }
  //   onClick();
  // };

  // NAYA - bas seedha onClick call karo
  const handleFeatureClick = (onClick) => {
    onClick();
  };
  const features = [
    {
      icon: <Map sx={{ fontSize: 40 }} />,
      title: "Map View",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit ullam",
      onClick: onNavigateToMap, // ← Yeh line add karo
    },
    {
      icon: <Dashboard sx={{ fontSize: 40 }} />,
      title: "Dashboard",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit ullam",
      onClick: onNavigateToDashboard,
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      title: "User Management",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit ullam",
      onClick: onNavigateToUsers,
    },
    {
      icon: <Description sx={{ fontSize: 40 }} />,
      title: "Report",
      description:
        "Lorem ipsum dolor sit amet consectetur adipiscing elit ullam",
      onClick: () => alert("Report coming soon"),
    },
  ];

  const FeatureCard = ({ icon, title, description, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <Card
        onClick={() => handleFeatureClick(onClick)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          background: isHovered
            ? "rgba(255, 255, 255, 1)"
            : "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(20px)",
          borderRadius: "1rem",
          padding: "1.5rem",
          border: "1px solid rgba(255, 255, 255, 0.3)",
          textAlign: "center",
          transition: "all 0.3s ease",
          cursor: "pointer",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          boxShadow: isHovered
            ? "0 20px 60px rgba(0, 0, 0, 0.3)"
            : "0 4px 12px rgba(0, 0, 0, 0.1)",
        }}
        elevation={0}
      >
        <CardContent sx={{ padding: 0 }}>
          <Box
            sx={{
              width: "70px",
              height: "70px",
              margin: "0 auto 1rem",
              background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              transition: "all 0.3s",
              transform: isHovered ? "scale(1.1) rotate(5deg)" : "scale(1)",
            }}
          >
            {icon}
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: "1.15rem",
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: "0.5rem",
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.85rem",
              color: "#64748b",
              lineHeight: "1.6",
            }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px); 
              opacity: 0.4; 
            }
            50% { 
              transform: translateY(-15px); 
              opacity: 0.7; 
            }
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }
        `}
      </style>

      <Box
        sx={{
          position: "relative",
          height: "100vh",
          width: "100%",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #334155 100%)",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Animated Background */}
        <NeonNetworkBackground />

        {/* Header */}
        <AppBar
          position="relative"
          elevation={0}
          sx={{
            zIndex: 100,
            background: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(15px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Toolbar
            sx={{ justifyContent: "space-between", padding: "0.5rem 2rem" }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {/* HCG Logo - Top Left */}
              <Box
                component="img"
                src={hcgLogo}
                alt="Haryana City Gas Logo"
                sx={{
                  width: "80px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  background: "white",
                  padding: "3px",
                  boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
                }}
              />
              <Typography
                sx={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "white",
                  letterSpacing: "-0.01em",
                }}
              >
                MapGeoid CITY GAS
              </Typography>
            </Box>

            {/* <Box sx={{ display: "flex", gap: "0.75rem" }}>
              <IconButton
                onClick={() => setShowLogin(true)}
                sx={{
                  width: "40px",
                  height: "40px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  transition: "all 0.3s",
                  color: "white",
                  "&:hover": {
                    background: "rgba(255, 255, 255, 0.2)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <AccountCircle />
              </IconButton>
            </Box> */}

            <Box sx={{ display: "flex", gap: "0.75rem" }}>
              {isLoggedIn ? (
                <>
                  <Typography
                    sx={{
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "0.9rem",
                      marginRight: "0.5rem",
                    }}
                  >
                    Welcome,{" "}
                    {JSON.parse(localStorage.getItem("user") || "{}").username}
                  </Typography>
                  <Button
                    onClick={handleLogout}
                    variant="outlined"
                    sx={{
                      color: "white",
                      borderColor: "rgba(255, 255, 255, 0.3)",
                      textTransform: "none",
                      fontSize: "0.9rem",
                      "&:hover": {
                        borderColor: "rgba(255, 255, 255, 0.5)",
                        background: "rgba(255, 255, 255, 0.1)",
                      },
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <IconButton
                  onClick={() => setShowLogin(true)}
                  sx={{
                    width: "40px",
                    height: "40px",
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    transition: "all 0.3s",
                    color: "white",
                    "&:hover": {
                      background: "rgba(255, 255, 255, 0.2)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <AccountCircle />
                </IconButton>
              )}
            </Box>
            {/* Bad me delete kar sakte hai */}
          </Toolbar>
        </AppBar>

        {/* Hero Section */}
        <Box
          sx={{
            position: "relative",
            zIndex: 10,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "3rem 2rem",
            height: "calc(100vh - 140px)",
          }}
        >
          {/* Title Section */}
          <Box sx={{ textAlign: "center", marginBottom: "3rem" }}>
            <Typography
              component="h1"
              sx={{
                fontSize: "3.75rem",
                fontWeight: "bold",
                color: "white",
                letterSpacing: "-0.02em",
                marginBottom: "0.75rem",
                textShadow: "0 4px 20px rgba(59, 130, 246, 0.5)",
                background: "linear-gradient(135deg, #ffffff 0%, #60c5ff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MapGeoid City Gas GIS Portal
            </Typography>
          </Box>

          {/* Feature Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(4, 1fr)",
              },
              gap: "1.5rem",
              maxWidth: "1200px",
              width: "100%",
            }}
          >
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </Box>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 2rem",
            backdropFilter: "blur(15px)",
            background: "rgba(0, 0, 0, 0.5)",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "rgba(255, 255, 255, 0.8)",
            }}
          >
            <Typography variant="body2" sx={{ fontSize: "0.9rem" }}>
              Developed by:
            </Typography>
            {/* MapGeoid Logo - Bottom Left */}
            <Box
              component="img"
              src={mapgeoidLogo}
              alt="MapGeoid Logo"
              sx={{
                width: "40px",
                height: "40px",
                objectFit: "contain",
                borderRadius: "4px",
              }}
            />
            <Typography
              variant="body2"
              sx={{
                fontWeight: "600",
                color: "white",
                fontSize: "1rem",
              }}
            >
              MapGeoid
            </Typography>
          </Box>

          <IconButton
            sx={{
              fontSize: "2rem",
              color: "#fbbf24",
              transition: "all 0.3s",
              "&:hover": {
                transform: "scale(1.2) rotate(20deg)",
                color: "#fcd34d",
              },
            }}
          >
            <Stars />
          </IconButton>
        </Box>

        {/* Login Modal */}
        {showLogin && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.5)",
            }}
            onClick={() => setShowLogin(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              sx={{
                // width: "500px",
                maxWidth: "500px",
                // padding: { xs: "2rem 1.5rem", sm: "2.5rem 2rem", md: "3rem 2.5rem" },
                padding: "3rem 2.5rem",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                position: "relative",
              }}
            >
              {/* Close Button */}
              <IconButton
                onClick={() => {
                  setShowLogin(false);
                  setError(""); // ← ADD
                  setSuccess(""); // ← ADD
                }}
                sx={{
                  position: "absolute",
                  top: "0rem",
                  right: "0rem",
                  color: "#64748b",
                  "&:hover": {
                    color: "#1e293b",
                    background: "#f1f5f9",
                  },
                }}
              >
                <Close />
              </IconButton>

              {/* HCG Logo */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "2rem",
                }}
              >
                <Box
                  component="img"
                  src={hcgLogo}
                  alt="HCG Logo"
                  sx={{
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </Box>

              {/* LOGIN Title */}
              <Typography
                variant="h4"
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: "2.5rem",
                  fontSize: "2rem",
                }}
              >
                LOGIN
              </Typography>
              {/* ADD THESE ALERTS */}
              {error && (
                <Alert severity="error" sx={{ marginBottom: "1rem" }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ marginBottom: "1rem" }}>
                  {success}
                </Alert>
              )}

              {/* Login Form */}
              <Box
                component="form"
                onSubmit={handleLogin}
                sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
              >
                {/* Username Field */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Person sx={{ fontSize: "1.2rem", color: "#1e293b" }} />
                    <Typography
                      sx={{
                        fontWeight: "600",
                        color: "#1e293b",
                        fontSize: "0.95rem",
                      }}
                    >
                      Username
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    variant="outlined"
                    required
                    disabled={loading} // ← ADD THIS LINE
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        background: "#f8fafc",
                        "& fieldset": {
                          borderColor: "#e2e8f0",
                        },
                        "&:hover fieldset": {
                          borderColor: "#cbd5e1",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                        },
                      },
                      "& input": {
                        padding: "0.9rem 1rem",
                      },
                    }}
                  />
                </Box>

                {/* Password Field */}
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Lock sx={{ fontSize: "1.2rem", color: "#1e293b" }} />
                    <Typography
                      sx={{
                        fontWeight: "600",
                        color: "#1e293b",
                        fontSize: "0.95rem",
                      }}
                    >
                      Password
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    variant="outlined"
                    required
                    disabled={loading}
                    // InputProps={{
                    //   endAdornment: (
                    //     <InputAdornment position="end">
                    //       <IconButton
                    //         onClick={() => setShowPassword(!showPassword)}
                    //         edge="end"
                    //         sx={{ color: "#64748b" }}
                    //       >
                    //         {showPassword ? <VisibilityOff /> : <Visibility />}
                    //       </IconButton>
                    //     </InputAdornment>

                    //   ),
                    // }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        background: "#f8fafc",
                        "& fieldset": {
                          borderColor: "#e2e8f0",
                        },
                        "&:hover fieldset": {
                          borderColor: "#cbd5e1",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                        },
                      },
                      "& input": {
                        padding: "0.9rem 1rem",
                      },
                    }}
                  />
                </Box>
                {/* Forgot Password Link */}
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    component="a"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowLogin(false);
                      setShowForgotPassword(true);
                    }}
                    sx={{
                      color: "#10b981",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Forgot Password
                  </Typography>
                </Box>

                {/* Login Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    padding: "0.9rem",
                    borderRadius: "8px",
                    background: "#f97316",
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                    "&:hover": {
                      background: "#ea580c",
                      boxShadow: "0 6px 16px rgba(249, 115, 22, 0.4)",
                    },
                    "&:disabled": {
                      // ← ADD THIS
                      background: "#cbd5e1",
                    },
                  }}
                >
                  {loading ? ( // ← REPLACE "LOGIN" WITH THIS
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "LOGIN"
                  )}
                </Button>
              </Box>
            </Card>
          </Box>
        )}
        {showForgotPassword && (
          <Box
            sx={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0, 0, 0, 0.5)",
            }}
            onClick={() => setShowForgotPassword(false)}
          >
            <Card
              onClick={(e) => e.stopPropagation()}
              sx={{
                maxWidth: "450px",
                padding: "3rem 2.5rem",
                background: "white",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                position: "relative",
              }}
            >
              <IconButton
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(""); // ← ADD
                  setSuccess(""); // ← ADD
                }}
                sx={{
                  position: "absolute",
                  top: "0rem",
                  right: "0rem",
                  color: "#64748b",
                  "&:hover": {
                    color: "#1e293b",
                    background: "#f1f5f9",
                  },
                }}
              >
                <Close />
              </IconButton>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "2rem",
                }}
              >
                <Box
                  component="img"
                  src={hcgLogo}
                  alt="HCG Logo"
                  sx={{
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </Box>

              <Typography
                variant="h4"
                sx={{
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#1e293b",
                  marginBottom: "1rem",
                  fontSize: "1.8rem",
                }}
              >
                Forgot Password
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  textAlign: "center",
                  color: "#64748b",
                  marginBottom: "2rem",
                }}
              >
                Enter your email address and we'll send you a link to reset your
                password.
              </Typography>
              {/* ADD THESE ALERTS */}
              {error && (
                <Alert severity="error" sx={{ marginBottom: "1rem" }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ marginBottom: "1rem" }}>
                  {success}
                </Alert>
              )}

              <Box
                component="form"
                onSubmit={handleForgotPassword}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.5rem",
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <Email sx={{ fontSize: "1.2rem", color: "#1e293b" }} />
                    <Typography
                      sx={{
                        fontWeight: "600",
                        color: "#1e293b",
                        fontSize: "0.95rem",
                      }}
                    >
                      Email Address
                    </Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    variant="outlined"
                    required
                    disabled={loading}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "8px",
                        background: "#f8fafc",
                        "& fieldset": {
                          borderColor: "#e2e8f0",
                        },
                        "&:hover fieldset": {
                          borderColor: "#cbd5e1",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#3b82f6",
                        },
                      },
                      "& input": {
                        padding: "0.9rem 1rem",
                      },
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    padding: "0.9rem",
                    borderRadius: "8px",
                    background: "#10b981",
                    textTransform: "none",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    letterSpacing: "0.5px",
                    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                    "&:hover": {
                      background: "#059669",
                      boxShadow: "0 6px 16px rgba(16, 185, 129, 0.4)",
                    },
                    "&:disabled": {
                      // ← ADD THIS
                      background: "#cbd5e1",
                    },
                  }}
                >
                  {loading ? ( // ← REPLACE TEXT WITH THIS
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <Box sx={{ textAlign: "center" }}>
                  <Typography
                    component="a"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(false);
                      setShowLogin(true);
                      setError(""); // ← ADD
                      setSuccess(""); // ← ADD
                    }}
                    sx={{
                      color: "#1976d2",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Back to Login
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    </>
  );
};
export default React.memo(HaryanaGasPortal);
// export default HaryanaGasPortal;
