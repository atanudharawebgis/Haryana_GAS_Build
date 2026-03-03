import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
} from "@mui/material";
import {
  Person,
  Lock,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

// Import logo
import hcgLogo from "./assets/HCG-logo-1.png";

const NeonNetworkBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById("login-bg");
    const ctx = canvas.getContext("2d");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const total = 30;

    for (let i = 0; i < total; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
          if (i !== j) {
            const dist = Math.sqrt((n1.x - n2.x) ** 2 + (n1.y - n2.y) ** 2);
            if (dist < 150) {
              ctx.globalAlpha = 1 - dist / 150;
              ctx.strokeStyle = "rgba(100, 200, 255, 0.5)";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(n1.x, n1.y);
              ctx.lineTo(n2.x, n2.y);
              ctx.stroke();
            }
          }
        });
      });

      ctx.globalAlpha = 1;

      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.fillStyle = "#60c5ff";
        ctx.shadowColor = "#60c5ff";
        ctx.shadowBlur = 10;
        ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
        ctx.fill();

        n.x += n.vx;
        n.y += n.vy;

        if (n.x < 0 || n.x > canvas.width) n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });

      requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <canvas
      id="login-bg"
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

const HCGLoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: false, password: false });

  const handleLogin = () => {
    const newErrors = {
      username: username.trim() === "",
      password: password.trim() === "",
    };
    setErrors(newErrors);

    if (!newErrors.username && !newErrors.password) {
      console.log("Login successful", { username, password });
      // Add your login logic here
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #334155 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Animated Background */}
      <NeonNetworkBackground />

      {/* Login Card */}
      <Card
        sx={{
          position: "relative",
          zIndex: 10,
          maxWidth: 420,
          width: "90%",
          background: "rgba(255, 255, 255, 0.98)",
          backdropFilter: "blur(20px)",
          borderRadius: "16px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <CardContent sx={{ padding: "3rem 2.5rem" }}>
          {/* Logo */}
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
                width: "280px",
                height: "auto",
                objectFit: "contain",
              }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h4"
            sx={{
              textAlign: "center",
              fontWeight: "bold",
              color: "#1e293b",
              marginBottom: "2rem",
              fontSize: "2rem",
            }}
          >
            LOGIN
          </Typography>

          {/* Username Field */}
          <Box sx={{ marginBottom: "1.5rem" }}>
            <Typography
              sx={{
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              <Person sx={{ fontSize: 18, verticalAlign: "middle", mr: 0.5 }} />
              Username
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setErrors({ ...errors, username: false });
              }}
              onKeyPress={handleKeyPress}
              error={errors.username}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  "& fieldset": {
                    borderColor: errors.username ? "#ef4444" : "#e2e8f0",
                  },
                  "&:hover fieldset": {
                    borderColor: errors.username ? "#ef4444" : "#cbd5e1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: errors.username ? "#ef4444" : "#3b82f6",
                  },
                },
              }}
            />
            {errors.username && (
              <Typography
                sx={{
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                  fontWeight: "500",
                }}
              >
                Username is required
              </Typography>
            )}
          </Box>

          {/* Password Field */}
          <Box sx={{ marginBottom: "1rem" }}>
            <Typography
              sx={{
                fontWeight: "600",
                color: "#1e293b",
                marginBottom: "0.5rem",
                fontSize: "0.95rem",
              }}
            >
              <Lock sx={{ fontSize: 18, verticalAlign: "middle", mr: 0.5 }} />
              Password
            </Typography>
            <TextField
              fullWidth
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors({ ...errors, password: false });
              }}
              onKeyPress={handleKeyPress}
              error={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                  backgroundColor: "#f8fafc",
                  "& fieldset": {
                    borderColor: errors.password ? "#ef4444" : "#e2e8f0",
                  },
                  "&:hover fieldset": {
                    borderColor: errors.password ? "#ef4444" : "#cbd5e1",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: errors.password ? "#ef4444" : "#3b82f6",
                  },
                },
              }}
            />
            {errors.password && (
              <Typography
                sx={{
                  color: "#ef4444",
                  fontSize: "0.85rem",
                  marginTop: "0.25rem",
                  fontWeight: "500",
                }}
              >
                Password is required
              </Typography>
            )}
          </Box>

          {/* Forgot Password Link */}
          <Box sx={{ textAlign: "right", marginBottom: "1.5rem" }}>
            <Link
              href="#"
              sx={{
                color: "#22c55e",
                fontSize: "0.9rem",
                textDecoration: "none",
                fontWeight: "500",
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Forgot Your Password? Click here
            </Link>
          </Box>

          {/* Login Button */}
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              background: "linear-gradient(135deg, #fb923c 0%, #f97316 100%)",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: "bold",
              padding: "0.9rem",
              borderRadius: "8px",
              textTransform: "uppercase",
              boxShadow: "0 4px 12px rgba(251, 146, 60, 0.4)",
              "&:hover": {
                background: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
                boxShadow: "0 6px 16px rgba(251, 146, 60, 0.5)",
              },
            }}
          >
            LOGIN
          </Button>
        </CardContent>
      </Card>

      {/* Footer */}
      <Box
        sx={{
          position: "absolute",
          bottom: "1.5rem",
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <Typography
          variant="body2"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "0.9rem",
          }}
        >
          Developed by{" "}
          <Box
            component="span"
            sx={{
              fontWeight: "600",
              color: "white",
            }}
          >
            MapGeoid
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default HCGLoginPage;