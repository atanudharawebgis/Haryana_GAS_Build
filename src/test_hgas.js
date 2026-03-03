// https://gis.hcgonline.co.in/geoserver/wms?service=WMS&request=GetMap&layers=haryanagas:ga_boundary,haryanagas:cng_boundary,haryanagas:cgs,haryanagas:compressor,haryanagas:dispenser,haryanagas:odorizer,haryanagas:cascade,haryanagas:cng_station,haryanagas:steel_pipelines,haryanagas:tlp,haryanagas:mdpe_pipelines,haryanagas:valve,haryanagas:ci,haryanagas:dpng_survey,haryanagas:pole_marker,haryanagas:rcc_marker,haryanagas:road,haryanagas:wall,haryanagas:house,haryanagas:connection_pit,haryanagas:electric_pole,haryanagas:offset_tbl,haryanagas:depth,haryanagas:incident_reporting,haryanagas:gas_leak,haryanagas:fieldasset&styles=&format=image/png&transparent=true&version=1.3.0&edgeBufferTiles=15&width=256&height=256&crs=EPSG:3857&bbox=8570731.107560245,3306971.5917298673,8590298.98680125,3326539.470970869

import React, { useState, useEffect, useRef } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  TextField,
  Collapse,
  Menu,
  MenuItem,
  Paper,
  Divider,
  Tabs,
  Tab,
  Button,
  Checkbox,
  Select,
  InputAdornment,
  // ListItemIcon,
} from "@mui/material";
import {
  Close as CloseIcon,
  Layers as LayersIcon,
  Map as MapIcon,
  Search as SearchIcon,
  Build as BuildIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  MyLocation as MyLocationIcon,
  MoreVert as MoreVertIcon,
  ExpandLess,
  ExpandMore,
  FilterList as FilterIcon,
  Print as PrintIcon,
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  Public as PublicIcon,
  LocationOn as LocationOnIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import XYZ from "ol/source/XYZ";

import ImageLayer from "ol/layer/Image";
import ImageWMS from "ol/source/ImageWMS";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Style, Icon } from "ol/style";

function App({ onBackToHome }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState("11541");
  const [activeTab, setActiveTab] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [layerFilter, setLayerFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [baseMapMenuAnchor, setBaseMapMenuAnchor] = useState(null);
  const [currentBaseMap, setCurrentBaseMap] = useState("osm");
  const [drawerWidth, setDrawerWidth] = useState(280); // ADD
  const [isResizing, setIsResizing] = useState(false);

  // FIXED LAYERS STATE
  const [layers, setLayers] = useState({
  // Main Boundary Group
  boundary: {
    name: "Boundary",
    visible: true,
    group: "root",
    isGroup: true,
    expanded: true,
  },
  
  // GA Boundary (parent under Boundary)
  "haryanagas:ga_boundary": {
    name: "GA Boundary",
    visible: true,
    group: "boundary",
    parent: "boundary",
    hasChildren: true,
    expanded: false,
  },
  "haryanagas:gurgaon_2_hcg": {
    name: "Gurgaon-2 HCG",
    visible: false,
    group: "boundary",
    parent: "haryanagas:ga_boundary",
  },
  "haryanagas:gurgaon_1_igl": {
    name: "Gurgaon-1 IGL",
    visible: false,
    group: "boundary",
    parent: "haryanagas:ga_boundary",
  },
  
  // CA Boundary (parent under Boundary)
  "haryanagas:ca_boundary": {
    name: "CA Boundary",
    visible: false,
    group: "boundary",
    parent: "boundary",
    hasChildren: false,
  },
  
  // CNG Boundary (parent under Boundary)
  "haryanagas:cng_boundary": {
    name: "CNG Boundary",
    visible: true,
    group: "boundary",
    parent: "boundary",
    hasChildren: true,
    expanded: true,
  },
  "haryanagas:cng_office": {
    name: "CNG Office",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
  "haryanagas:cng_station": {
    name: "CNG Station",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
  "haryanagas:compressor_unit": {
    name: "Compressor Unit",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
  "haryanagas:drs_boundary": {
    name: "DRS Boundary",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
  "haryanagas:platform": {
    name: "Platform",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
  "haryanagas:other_boundary": {
    name: "Other",
    visible: false,
    group: "boundary",
    parent: "haryanagas:cng_boundary",
  },
});

  // FIXED useEffect
  useEffect(() => {
    const visibleLayers = [];

    // Iterate over layers object (not array)
    Object.entries(layers).forEach(([layerKey, layer]) => {
      if (layer.visible) {
        visibleLayers.push(layerKey); // Use key as layer name
      }
    });

    setEnabledLayers(visibleLayers);
  }, [layers]);

  const WMS_URL = "https://gis.hcgonline.co.in/geoserver/wms";
  

  const [enabledLayers, setEnabledLayers] = useState([]);

  // Basemap config
  const baseMaps = {
    osm: {
      name: "OpenStreetMap",
      layer: () => new TileLayer({ source: new OSM() }),
      thumbnail: "https://tile.openstreetmap.org/5/16/10.png",
    },
    worldNavigation: {
      name: "World Navigation Map",
      layer: () =>
        new TileLayer({
          source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 16,
          }),
        }),
      thumbnail:
        "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/5/16/10", // ADD
    },
    worldStreetNight: {
      name: "World Street Map (Night)",
      layer: () =>
        new TileLayer({
          source: new XYZ({
            url: "https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
            maxZoom: 19,
          }),
        }),
      thumbnail: "https://a.basemaps.cartocdn.com/dark_all/5/16/10.png", // ADD
    },
    imageryLabels: {
      name: "Imagery with Labels",
      layer: () =>
        new TileLayer({
          source: new XYZ({
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            maxZoom: 19,
          }),
        }),
      thumbnail:
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/16/10", // ADD
    },
    topographic: {
      name: "Topographic",
      layer: () =>
        new TileLayer({
          source: new XYZ({
            url: "https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png",
            maxZoom: 17,
          }),
        }),
      thumbnail: "https://a.tile.opentopomap.org/5/16/10.png", // ADD
    },
  };

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  const baseLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(null);
      mapInstanceRef.current = null;
    }

    const osmLayer = new TileLayer({
      source: new OSM(),
      name: "osm",
    });
    baseLayerRef.current = osmLayer;

    const vectorSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: vectorSource,
      name: "markers",
    });
    markerLayerRef.current = markerLayer;

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, markerLayer],
      controls: [],
      view: new View({
        center: fromLonLat([76.993869, 28.448841]),

        zoom: 10,
        maxZoom: 20,
        minZoom: 2,
      }),
    });

    mapInstanceRef.current = map;

    setTimeout(() => {
      map.updateSize();
    }, 100);

    map.on("pointermove", (evt) => {
      const coords = toLonLat(evt.coordinate);
      setCoordinates({
        x: coords[0].toFixed(6),
        y: coords[1].toFixed(6),
      });
    });

    map.on("moveend", () => {
      const view = map.getView();
      const resolution = view.getResolution();
      const units = view.getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = units === "degrees" ? 111194.87428468118 : 1;
      const calculatedScale = Math.round(resolution * mpu * 39.37 * dpi);
      setScale(calculatedScale.toString());
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(null);
      }
    };
  }, []);
  // koushik
  useEffect(() => {
    if (mapInstanceRef.current && enabledLayers) {
      // Add new WMS layer
      const wmsLayer = new ImageLayer({
        source: new ImageWMS({
          url: WMS_URL,
          params: { LAYERS: enabledLayers.join(",") },
          ratio: 1,
          serverType: "geoserver",
        }),
      });
      wmsLayer.set("name", "wmsLayer"); // tag it for easy removal later
      mapInstanceRef.current.addLayer(wmsLayer);
    }
  }, [enabledLayers, mapInstanceRef]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.updateSize();
      }, 300);
    }
  }, [drawerOpen]);

  const handleZoomIn = () => {
    const view = mapInstanceRef.current?.getView();
    if (view) {
      view.animate({ zoom: view.getZoom() + 1, duration: 250 });
    }
  };

  const handleZoomOut = () => {
    const view = mapInstanceRef.current?.getView();
    if (view) {
      view.animate({ zoom: view.getZoom() - 1, duration: 250 });
    }
  };

  const handleHome = () => {
    const view = mapInstanceRef.current?.getView();
    if (view) {
      view.animate({
        center: fromLonLat([76.993869, 28.448841]),
        zoom: 10,
        duration: 500,
      });
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const view = mapInstanceRef.current?.getView();
        const lon = position.coords.longitude;
        const lat = position.coords.latitude;

        if (view) {
          view.animate({
            center: fromLonLat([lon, lat]),
            zoom: 15,
            duration: 500,
          });
        }

        // Add blue marker at current location
        if (markerLayerRef.current) {
          const vectorSource = markerLayerRef.current.getSource();
          vectorSource.clear();

          const marker = new Feature({
            geometry: new Point(fromLonLat([lon, lat])),
          });

          // Create blue marker for current location
          const markerStyle = new Style({
            image: new Icon({
              anchor: [0.5, 0.5],
              anchorXUnits: "fraction",
              anchorYUnits: "fraction",
              src:
                "data:image/svg+xml;charset=utf-8," +
                encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#2196F3" stroke="white" stroke-width="3"/>
                  <circle cx="12" cy="12" r="4" fill="white"/>
                </svg>
              `),
              scale: 1,
            }),
          });

          marker.setStyle(markerStyle);
          vectorSource.addFeature(marker);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location. ";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage +=
              "Please enable location permission in your browser settings and try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage +=
              "Location information is unavailable. Please check your GPS/network connection.";
            break;
          case error.TIMEOUT:
            errorMessage += "Location request timed out. Please try again.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const toggleLayerVisibility = (layerKey) => {
    setLayers((prev) => ({
      ...prev,
      [layerKey]: {
        ...prev[layerKey],
        visible: !prev[layerKey].visible,
      },
    }));
  };

  const changeBaseMap = (mapType) => {
    if (mapInstanceRef.current && baseLayerRef.current) {
      const map = mapInstanceRef.current;
      const layers = map.getLayers();

      layers.removeAt(0);

      const newBaseLayer = baseMaps[mapType].layer();
      layers.insertAt(0, newBaseLayer);
      baseLayerRef.current = newBaseLayer;

      setCurrentBaseMap(mapType);
      setBaseMapMenuAnchor(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        goToLocation(result);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const handleSearchInput = async (value) => {
    setSearchQuery(value);

    if (value.trim().length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value
          )}&limit=5`
        );
        const data = await response.json();
        setSearchResults(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Search error:", error);
      }
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
    }
  };

  const goToLocation = (result) => {
    const view = mapInstanceRef.current?.getView();
    const lon = parseFloat(result.lon);
    const lat = parseFloat(result.lat);

    if (view) {
      view.animate({
        center: fromLonLat([lon, lat]),
        zoom: 15,
        duration: 500,
      });
    }

    // Add marker at searched location
    if (markerLayerRef.current) {
      const vectorSource = markerLayerRef.current.getSource();
      vectorSource.clear(); // Clear previous markers

      const marker = new Feature({
        geometry: new Point(fromLonLat([lon, lat])),
      });

      // Create marker style with SVG
      const markerStyle = new Style({
        image: new Icon({
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          src:
            "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
              <path fill="red" stroke="white" stroke-width="3" d="M20,0 C9,0 0,9 0,20 C0,35 20,52 20,52 C20,52 40,35 40,20 C40,9 31,0 20,0 Z"/>
              <circle cx="20" cy="20" r="8" fill="white"/>
            </svg>
          `),
          scale: 0.8,
        }),
      });

      marker.setStyle(markerStyle);
      vectorSource.addFeature(marker);
    }

    setSearchQuery(result.display_name);
    setShowSuggestions(false);
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };
  // ADD THESE HANDLERS
  const handleMouseDown = () => {
    setIsResizing(true);
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 500) {
        setDrawerWidth(newWidth);
      }
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        bgcolor: "#f5f5f5",
        overflow: "hidden",
      }}
    >
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
          <IconButton
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
          </IconButton>
          {/* ADD BACK BUTTON - END */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexGrow: 1,
            }}
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
              sx={{
                border: "1px solid #fcfcfcff",
                color: "white",
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => setAnchorEl(null)}>Home</MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)}>Profile</MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)}>Dashboard</MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          display: "flex",
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? drawerWidth : 0, // CHANGE
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth, // CHANGE
              position: "relative",
              border: "none",
              borderRight: "1px solid #e0e0e0",
              height: "100%",
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid #e0e0e0",
                bgcolor: "#fafafa",
              }}
            >
              <Tabs
                value={activeTab}
                onChange={(e, newValue) => setActiveTab(newValue)}
                sx={{
                  flex: 1,
                  minHeight: "40px",
                  "& .MuiTab-root": {
                    minHeight: "40px",
                    textTransform: "none",
                    fontSize: "13px",
                  },
                }}
              >
                <Tab label="Layers" />
                <Tab label="Legend" />
              </Tabs>

              <IconButton
                onClick={() => setDrawerOpen(!drawerOpen)}
                size="small"
                sx={{
                  mr: 1,
                  color: "#4caf50",
                  "&:hover": { bgcolor: "#f5f5f5" },
                }}
              >
                <FirstPageIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box
              sx={{
                p: 1,
                borderBottom: "1px solid #e0e0e0",
                display: "flex",
                gap: 0.5,
              }}
            >
              <Button
                size="small"
                variant="outlined"
                startIcon={<UploadIcon />}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontSize: "11px",
                }}
              >
                Upload
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontSize: "11px",
                }}
              >
                Export
              </Button>
            </Box>

            <Box sx={{ p: 1, borderBottom: "1px solid #e0e0e0" }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Filter layers..."
                value={layerFilter}
                onChange={(e) => setLayerFilter(e.target.value)}
                InputProps={{
                  endAdornment: layerFilter && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setLayerFilter("")}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ flex: 1, overflow: "auto" }}>
              <List dense>
                <ListItemButton
                  onClick={() => setLayersExpanded(!layersExpanded)}
                >
                  <Checkbox size="small" sx={{ p: 0, mr: 1 }} />
                  <LayersIcon
                    sx={{
                      mr: 1,
                      fontSize: 20,
                      color: "#1976d2",
                    }}
                  />
                  <ListItemText
                    primary="Assets"
                    primaryTypographyProps={{
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  />
                  {layersExpanded ? <ExpandLess /> : <ExpandMore />}
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
                <Collapse in={layersExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {Object.entries(layers)
                      //   .slice(0, 3)
                      .map(([key, layer]) => (
                        <ListItem key={key} sx={{ pl: 6 }}>
                          <Checkbox
                            size="small"
                            checked={layer.visible}
                            onChange={() => toggleLayerVisibility(key)}
                            sx={{ p: 0, mr: 1 }}
                          />
                          <ListItemText
                            primary={layer.name}
                            secondary={layer.visible ? "Visible" : "Hidden"}
                            primaryTypographyProps={{
                              fontSize: "13px",
                            }}
                            secondaryTypographyProps={{
                              fontSize: "11px",
                            }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Collapse>

                <Divider />

                {/* <ListItemButton
                  onClick={() => setLegendExpanded(!legendExpanded)}
                >
                  <Checkbox size="small" defaultChecked sx={{ p: 0, mr: 1 }} />
                  <LayersIcon
                    sx={{
                      mr: 1,
                      fontSize: 20,
                      color: "#1976d2",
                    }}
                  />
                  <ListItemText
                    primary="Local Government"
                    primaryTypographyProps={{
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  />
                  {legendExpanded ? <ExpandLess /> : <ExpandMore />}
                  <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </ListItemButton> */}
                <Collapse in={legendExpanded} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {Object.entries(layers)
                      //   .slice(3)
                      .map(([key, layer]) => (
                        <ListItem key={key} sx={{ pl: 6 }}>
                          <Checkbox
                            size="small"
                            checked={layer.visible}
                            onChange={() => toggleLayerVisibility(key)}
                            sx={{ p: 0, mr: 1 }}
                          />
                          <ListItemText
                            primary={layer.name}
                            secondary={layer.visible ? "Visible" : "Hidden"}
                            primaryTypographyProps={{
                              fontSize: "13px",
                            }}
                            secondaryTypographyProps={{
                              fontSize: "11px",
                            }}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Collapse>
              </List>
            </Box>
          </Box>
          {/* Resize Handle - ADD THIS */}
          {drawerOpen && (
            <Box
              onMouseDown={handleMouseDown}
              sx={{
                position: "absolute",
                right: 0,
                top: 0,
                bottom: 0,
                width: 4,
                cursor: "col-resize",
                bgcolor: "transparent",
                "&:hover": {
                  bgcolor: "#1976d2",
                },
                zIndex: 1001,
              }}
            />
          )}
        </Drawer>

        <Box
          sx={{
            flex: 1,
            position: "relative",
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {toolsOpen && (
            <Paper
              square
              elevation={3}
              sx={{
                bgcolor: "white",
                borderBottom: "2px solid #e0e0e0",
                flexShrink: 0,
                zIndex: 1001,
              }}
            >
              <Box
                sx={{
                  borderBottom: 1,
                  borderColor: "divider",
                  bgcolor: "#f8f9fa",
                }}
              >
                <Tabs
                  value={0}
                  sx={{
                    minHeight: 36,
                    "& .MuiTab-root": {
                      minHeight: 36,
                      textTransform: "none",
                      fontSize: "13px",
                      fontWeight: 500,
                      py: 0.5,
                    },
                  }}
                >
                  <Tab label="Tools" />
                  <Tab label="Data" />
                  <Tab label="Share" />
                  <Tab label="Reset" />
                  <Tab label="Workflows" />
                </Tabs>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 2,
                  py: 1,
                  bgcolor: "#e3f2fd",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <BuildIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Draw
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <MapIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Measure
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <LayersIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    All Markup
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <SearchIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Identify
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <SettingsIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Buffer
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <PrintIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Print
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <SearchIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Query
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.3,
                  }}
                >
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <FilterIcon
                      sx={{
                        color: "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Filter
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}

          <Box
            sx={{
              flex: 1,
              position: "relative",
              minHeight: 0,
            }}
          >
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                zIndex: 1000,
              }}
            >
              {!drawerOpen && (
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  size="small"
                  sx={{
                    border: "2px solid #1976d2",
                    borderRadius: "4px",
                    bgcolor: "white",
                    color: "#1976d2",
                    width: 32,
                    height: 32,
                    boxShadow: 2,
                    "&:hover": {
                      bgcolor: "#4caf50",
                      color: "white",
                    },
                  }}
                >
                  <LastPageIcon fontSize="small" />
                </IconButton>
              )}
              <IconButton
                onClick={handleHome}
                size="small"
                sx={{
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  bgcolor: "white",
                  color: "#1976d2",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                <HomeIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleZoomIn}
                size="small"
                sx={{
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  bgcolor: "white",
                  color: "#1976d2",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleZoomOut}
                size="small"
                sx={{
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  bgcolor: "white",
                  color: "#1976d2",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Box>

            <Box
              ref={mapRef}
              sx={{
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgcolor: "#f0f0f0",
              }}
            />

            {/* Tools Button */}
            <Paper
              sx={{
                position: "absolute",
                top: 16,
                right: 16,
                zIndex: 1002,
                borderRadius: 1,
              }}
            >
              <Button
                variant="contained"
                startIcon={<BuildIcon sx={{ fontSize: 16 }} />}
                onClick={() => setToolsOpen(!toolsOpen)}
                sx={{
                  textTransform: "none",
                  bgcolor: "white",
                  color: "#1976d2",
                  border: "2px solid #1976d2",
                  fontWeight: 500,
                  fontSize: "12px",
                  padding: "6px 12px",
                  height: "36px",
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                    borderColor: "#4caf50",
                  },
                }}
              >
                {toolsOpen ? "Hide" : "Tools"}
              </Button>
            </Paper>

            {/* Search Bar */}
            <Box
              sx={{
                position: "absolute",
                top: 16,
                right: 103,
                zIndex: 1000,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {searchOpen && (
                <Box sx={{ position: "relative" }}>
                  <Paper
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <TextField
                      placeholder="Search location..."
                      size="small"
                      value={searchQuery}
                      onChange={(e) => handleSearchInput(e.target.value)}
                      onKeyPress={handleSearchKeyPress}
                      sx={{
                        width: 210,
                        bgcolor: "white",
                        "& .MuiInputBase-root": {
                          height: 36,
                          fontSize: "13px",
                        },
                      }}
                    />
                    <IconButton
                      onClick={handleSearch}
                      size="small"
                      sx={{
                        bgcolor: "#1976d2",
                        color: "white",
                        width: 32,
                        height: 32,
                        mr: 0.5,
                        "&:hover": {
                          bgcolor: "#4caf50",
                        },
                      }}
                    >
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </Paper>

                  {showSuggestions && searchResults.length > 0 && (
                    <Paper
                      sx={{
                        position: "absolute",
                        top: 40,
                        left: 0,
                        width: 250,
                        maxHeight: 300,
                        overflow: "auto",
                        zIndex: 1001,
                      }}
                    >
                      <List dense>
                        {searchResults.map((result, index) => (
                          <ListItemButton
                            key={index}
                            onClick={() => goToLocation(result)}
                            sx={{
                              "&:hover": {
                                bgcolor: "#e3f2fd",
                              },
                            }}
                          >
                            <LocationOnIcon
                              sx={{
                                mr: 1,
                                fontSize: 18,
                                color: "#1976d2",
                              }}
                            />
                            <ListItemText
                              primary={result.display_name}
                              primaryTypographyProps={{
                                fontSize: "12px",
                                noWrap: false,
                              }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </Paper>
                  )}
                </Box>
              )}
              <IconButton
                onClick={() => {
                  setSearchOpen(!searchOpen);
                  if (searchOpen) {
                    setSearchQuery("");
                    setSearchResults([]);
                    setShowSuggestions(false);
                    // Clear marker when closing search
                    if (markerLayerRef.current) {
                      const vectorSource = markerLayerRef.current.getSource();
                      vectorSource.clear();
                    }
                  }
                }}
                size="small"
                sx={{
                  bgcolor: "white",
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  color: "#1976d2",
                  width: 36,
                  height: 36,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                    borderColor: "#4caf50",
                  },
                }}
              >
                {searchOpen ? (
                  <CloseIcon fontSize="small" />
                ) : (
                  <SearchIcon fontSize="small" />
                )}
              </IconButton>
            </Box>

            <Box
              sx={{
                position: "absolute",
                bottom: 60,
                right: 16,
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                zIndex: 1000,
              }}
            >
              <IconButton
                onClick={handleMyLocation}
                size="small"
                sx={{
                  bgcolor: "white",
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  color: "#1976d2",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                <MyLocationIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={(e) => setBaseMapMenuAnchor(e.currentTarget)}
                size="small"
                sx={{
                  bgcolor: "white",
                  border: "2px solid #1976d2",
                  borderRadius: "4px",
                  color: "#1976d2",
                  width: 32,
                  height: 32,
                  boxShadow: 2,
                  "&:hover": {
                    bgcolor: "#4caf50",
                    color: "white",
                  },
                }}
              >
                <PublicIcon fontSize="small" />
              </IconButton>

              <Menu
                anchorEl={baseMapMenuAnchor}
                open={Boolean(baseMapMenuAnchor)}
                onClose={() => setBaseMapMenuAnchor(null)}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                transformOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                PaperProps={{
                  sx: { width: 280 },
                }}
              >
                {Object.keys(baseMaps).map((mapType) => (
                  <MenuItem
                    key={mapType}
                    onClick={() => changeBaseMap(mapType)}
                    selected={currentBaseMap === mapType}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      py: 1,
                    }}
                  >
                    {/* Real Thumbnail Image */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        border:
                          currentBaseMap === mapType
                            ? "2px solid #1976d2"
                            : "1px solid #e0e0e0",
                        borderRadius: 1,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={baseMaps[mapType].thumbnail}
                        alt={baseMaps[mapType].name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>

                    <ListItemText>{baseMaps[mapType].name}</ListItemText>

                    {currentBaseMap === mapType && (
                      <CheckCircleIcon fontSize="small" color="primary" />
                    )}
                  </MenuItem>
                ))}
              </Menu>
            </Box>

            <Paper
              square
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                p: 1,
                px: 2,
                display: "flex",
                justifyContent: "space-between",
                zIndex: 1000,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Select size="small" value="xy" sx={{ fontSize: "12px" }}>
                  <MenuItem value="xy">X/Y</MenuItem>
                  <MenuItem value="latlon">Lat/Lon</MenuItem>
                </Select>
                <Typography variant="caption">X: {coordinates.x}</Typography>
                <Typography variant="caption">Y: {coordinates.y}</Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  alignItems: "center",
                }}
              >
                <Typography variant="caption">Scale</Typography>
                <Select
                  size="small"
                  value={scale}
                  onChange={(e) => setScale(e.target.value)}
                  sx={{ fontSize: "12px", width: 100 }}
                >
                  <MenuItem value="1000">1:1000</MenuItem>
                  <MenuItem value="5000">1:5000</MenuItem>
                  <MenuItem value="11541">1:11541</MenuItem>
                  <MenuItem value="50000">1:50000</MenuItem>
                </Select>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
export default React.memo(App);
// export default App;
// Final


const man {
  
}
