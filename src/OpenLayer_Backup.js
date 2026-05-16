import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Rnd } from "react-rnd";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  SvgIcon,
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
  Bookmark as BookmarkIcon,
  CloudUpload as CloudUploadIcon,
  VerticalAlignBottom as DockIcon,
  OpenInNew as UndockIcon,
  Edit as EditIcon,
  SquareFoot as SquareFootIcon, // Measure
  ManageSearch as ManageSearchIcon, // Query
  FilterAlt as FilterAltIcon,
  AdsClick as AdsClickIcon, //select
  TravelExplore as TravelExploreIcon, //zoom to layer
  TableView as TableViewIcon, //open arrtibute table
  GridOn as GridOnIcon,
  TableChartOutlined as TableChartOutlinedIcon,
} from "@mui/icons-material";
import { useVirtualizer } from "@tanstack/react-virtual";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import XYZ from "ol/source/XYZ";
import PinDropIcon from "@mui/icons-material/PinDrop";

import CircleStyle from "ol/style/Circle";
import * as ol from "ol";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import TileWMS from "ol/source/TileWMS";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
import { Style, Icon, Stroke, Fill } from "ol/style";
import GeoJSON from "ol/format/GeoJSON";
// Measurement  states
import Draw from "ol/interaction/Draw";
import { getLength, getArea } from "ol/sphere";
import { LineString, Polygon } from "ol/geom"; // ADD THIS

const isValidExtent = (extent) => {
  if (!extent || extent.length !== 4) return false;
  if (!extent.every((val) => isFinite(val))) return false;

  const [minX, minY, maxX, maxY] = extent;
  const width = maxX - minX;
  const height = maxY - minY;

  // ✅ Allow very small extents (for points)
  return width >= 0 && height >= 0;
};

// ============================================
// GEOSERVER CONFIG
// ============================================
const GEOSERVER_CONFIG = {
  baseUrl: "https://gis.mapgeoid.com/geoserver",
  get wfsUrl() {
    return `${this.baseUrl}/wfs`;
  },
  get wmsUrl() {
    return `${this.baseUrl}/wms`;
  },
  getWfsUrlForLayer(wmsUrl) {
    // Layer ki wmsUrl se wfsUrl banao
    if (wmsUrl) return wmsUrl.replace("/wms", "/wfs");
    return this.wfsUrl;
  },
};

const DEFAULT_WFS_PARAMS = {
  service: "WFS",
  version: "1.0.0",
  request: "GetFeature",
  outputFormat: "application/json",
  srsName: "EPSG:4326",
};

const VirtualTable = ({
  attributeData,
  attributeColumns,
  selectedRows,
  setSelectedRows,
  updateMapSelectionFromRows,
  tableViewMode,
}) => {
  const parentRef = useRef(null);

  const tableData =
    tableViewMode === "all"
      ? attributeData
      : attributeData.filter((r) => selectedRows.includes(r.id));

  const rowVirtualizer = useVirtualizer({
    count: tableData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5,
  });

  return (
    <Box ref={parentRef} sx={{ height: "100%", overflow: "auto" }}>
      <Table stickyHeader size="small" sx={{ minWidth: "max-content" }}>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                bgcolor: "#e3f2fd",
                width: 40,
                borderRight: "1px solid #ddd",
                p: 0.5,
              }}
            >
              <Checkbox
                size="small"
                checked={
                  selectedRows.length === attributeData.length &&
                  attributeData.length > 0
                }
                indeterminate={
                  selectedRows.length > 0 &&
                  selectedRows.length < attributeData.length
                }
                onChange={(e) => {
                  const newSelected = e.target.checked
                    ? attributeData.map((r) => r.id)
                    : [];
                  setSelectedRows(newSelected);
                  updateMapSelectionFromRows(newSelected);
                }}
                sx={{ p: 0 }}
              />
            </TableCell>
            <TableCell
              sx={{
                bgcolor: "#e3f2fd",
                fontWeight: "bold",
                fontSize: 12,
                borderRight: "1px solid #ddd",
                width: 60,
              }}
            >
              #
            </TableCell>
            {attributeColumns.map((column) => (
              <TableCell
                key={column.id}
                sx={{
                  bgcolor: "#e3f2fd",
                  fontWeight: "bold",
                  fontSize: 12,
                  borderRight: "1px solid #ddd",
                  minWidth: 120,
                }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {/* Virtual height spacer */}
          <TableRow>
            <TableCell
              colSpan={attributeColumns.length + 2}
              sx={{
                p: 0,
                border: 0,
                height: `${rowVirtualizer.getTotalSize()}px`,
                position: "relative",
              }}
            >
              {/* Virtual rows */}
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = tableData[virtualRow.index];
                return (
                  <Table
                    key={row.id}
                    size="small"
                    sx={{
                      minWidth: "max-content",
                      width: "100%",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <TableBody>
                      <TableRow
                        sx={{
                          height: 35,
                          "&:nth-of-type(odd)": {
                            bgcolor: selectedRows.includes(row.id)
                              ? "#bbdefb !important"
                              : "#fafafa",
                          },
                          "&:hover": { bgcolor: "#e3f2fd" },
                          bgcolor: selectedRows.includes(row.id)
                            ? "#bbdefb !important"
                            : undefined,
                          cursor: "pointer",
                          display: "table-row",
                        }}
                      >
                        <TableCell
                          sx={{
                            width: 40,
                            borderRight: "1px solid #ddd",
                            p: 0.5,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox
                            size="small"
                            checked={selectedRows.includes(row.id)}
                            onChange={() => {
                              setSelectedRows((prev) => {
                                const newSelected = prev.includes(row.id)
                                  ? prev.filter((id) => id !== row.id)
                                  : [...prev, row.id];
                                updateMapSelectionFromRows(newSelected);
                                return newSelected;
                              });
                            }}
                            sx={{ p: 0 }}
                          />
                        </TableCell>
                        <TableCell
                          sx={{
                            width: 60,
                            fontSize: 11,
                            borderRight: "1px solid #ddd",
                            fontWeight: 500,
                          }}
                        >
                          {virtualRow.index + 1}
                        </TableCell>
                        {attributeColumns.map((column) => (
                          <TableCell
                            key={column.id}
                            sx={{
                              minWidth: 120,
                              fontSize: 11,
                              borderRight: "1px solid #ddd",
                            }}
                          >
                            {row[column.id] !== null &&
                            row[column.id] !== undefined
                              ? String(row[column.id])
                              : "-"}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                );
              })}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

function App({ onBackToHome, onNavigateToDashboard }) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [coordinates, setCoordinates] = useState({ x: 0, y: 0 });
  const [coordFormat, setCoordFormat] = useState("xy");
  const [scale, setScale] = useState("11541");
  const [scaleInput, setScaleInput] = useState("11541");
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
  const [layerMenuAnchor, setLayerMenuAnchor] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarkDialogOpen, setBookmarkDialogOpen] = useState(false);
  const [attributeTableOpen, setAttributeTableOpen] = useState(false);
  const [attributeData, setAttributeData] = useState([]);
  const [attributeColumns, setAttributeColumns] = useState([]);
  const [attributeLayerName, setAttributeLayerName] = useState("");
  const [attributeLoading, setAttributeLoading] = useState(false);

  const [selectedQueryLayer, setSelectedQueryLayer] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});

  const [tablePage, setTablePage] = useState(0);
  const [tableRowsPerPage, setTableRowsPerPage] = useState(50);

  // Print tab states - ADD AFTER OTHER STATES (around line 80)
  const [printTemplate, setPrintTemplate] = useState("landscape");
  const [printPage, setPrintPage] = useState("A4");
  const [printTitle, setPrintTitle] = useState("");
  const [printCreatedBy, setPrintCreatedBy] = useState("Current User");

  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printMapImage, setPrintMapImage] = useState(null);
  const [printGenerating, setPrintGenerating] = useState(false);

  const [printFormat, setPrintFormat] = useState("PNG"); // YE NAYA ADD KARO
  const [printInsetImage, setPrintInsetImage] = useState(null);

  const [activeTools, setActiveTools] = useState([]);
  const [drawType, setDrawType] = useState("Point");
  const [drawnFeatures, setDrawnFeatures] = useState([]);

  const [measureType, setMeasureType] = useState("LineString"); // LineString or Polygon
  const [measurements, setMeasurements] = useState([]);

  const [measureUnit, setMeasureUnit] = useState("meters"); // For length
  const [measureAreaUnit, setMeasureAreaUnit] = useState("sqmeters"); // For area
  const [isMeasuring, setIsMeasuring] = useState(false);
  // Filter tool states
  const [filterLayer, setFilterLayer] = useState("");
  const [filterAttribute, setFilterAttribute] = useState("");
  const [filterValue, setFilterValue] = useState("");

  // Asset search states
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [assetSearchResults, setAssetSearchResults] = useState([]);

  // Select tool state
  const [selectToolActive, setSelectToolActive] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);
  // Query tool states -
  const [queryLayer, setQueryLayer] = useState("");
  const [queryResults, setQueryResults] = useState([]);
  const [queryExpression, setQueryExpression] = useState("");

  const [queryClauses, setQueryClauses] = useState([
    { id: Date.now(), field: "", operator: "is equal to", value: "" },
  ]);
  const [invertWhere, setInvertWhere] = useState(false);
  const [queryLayerFields, setQueryLayerFields] = useState([]);
  // Filter ke liye ALAG states
  const [filterClauses, setFilterClauses] = useState([
    { id: Date.now(), field: "", operator: "is equal to", value: "" },
  ]);
  const [filterInvertWhere, setFilterInvertWhere] = useState(false);
  const [filterLayerFields, setFilterLayerFields] = useState([]);

  const [queryFieldValues, setQueryFieldValues] = useState({}); // { clauseId: [values] }
  const [queryFieldValuesLoading, setQueryFieldValuesLoading] = useState({});

  const [selectedRows, setSelectedRows] = useState([]); // selected row ids
  const [tableViewMode, setTableViewMode] = useState("all");
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [selectMode, setSelectMode] = useState("rectangle"); // "rectangle" | "freehand"
  const [selectInteractionRef] = useState({ current: null });
  const selectDrawLayerRef = useRef(null); // "all" or "selected"
  const [popupArrowDir, setPopupArrowDir] = useState("bottom");

  const measureTooltipRef = useRef(null);
  const measureOverlayRef = useRef(null);
  const attributeFeaturesRef = useRef([]); // store raw WFS features with geometry
  // NEW STATE for docked table height
  const [dockedTableHeight, setDockedTableHeight] = useState(300); // Default 300px
  const [isResizingDocked, setIsResizingDocked] = useState(false);

  const [attributeTableDocked, setAttributeTableDocked] = useState(false);
  const [attributeTableSize, setAttributeTableSize] = useState({
    width: 800,
    height: 500,
  });
  const [attributeTablePosition, setAttributeTablePosition] = useState({
    x: 100,
    y: 100,
  });

  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState(null);
  // const [popupPosition, setPopupPosition] = useState([0, 0]);
  const [popupPosition, setPopupPosition] = useState({ x: 100, y: 100 });
  const overlayRef = useRef(null);
  const [allPopupFeatures, setAllPopupFeatures] = useState([]);
  const [expandedAttributes, setExpandedAttributes] = useState({});
  const selectionLayerRef = useRef(null);
  const selectedRowsRef = useRef([]);
  const isDrawingActiveRef = useRef(false); // ADD THIS
  const isPopupClosingRef = useRef(false);
  const isZoomingToFeatureRef = useRef(false);
  const [popupMinimized, setPopupMinimized] = useState(false);

  // asset secarc near me
  const [assetSearchMode, setAssetSearchMode] = useState("idle"); // 'idle' | 'selecting'
  const [incidentPoint, setIncidentPoint] = useState(null);
  const [searchRange, setSearchRange] = useState(200);
  const [searchUnit, setSearchUnit] = useState("meters");
  const [assetLayerFilter, setAssetLayerFilter] = useState("All");
  const [assetResults, setAssetResults] = useState({});
  const [assetResultsExpanded, setAssetResultsExpanded] = useState({});
  const [assetSearchLoading, setAssetSearchLoading] = useState(false);

  const assetBufferLayerRef = useRef(null);
  const assetPointLayerRef = useRef(null);
  const isAssetSelectingRef = useRef(false);

  // asset secarc near me ENd

  //  WMS layers
  const [layerGroups, setLayerGroups] = useState({
    test: {
      name: "Test",
      visible: true,
      expanded: false,
      children: {
        test: {
          name: "USA Population",
          visible: true,
          wmsLayer: "topp:states",
        },
        Road: {
          name: "Road",
          visible: true,
          wmsLayer: "sf:roads",
        },
      },
    },
    Gas: {
      name: "Gas Data",
      visible: true,
      expanded: false,
      children: {
        Assembly: {
          name: "Pipeline Assembly",
          visible: true,
          wmsLayer: "GAS_DATA:main_pipelineassembly",
        },
        Device: {
          name: "Pipeline Device",
          visible: true,
          wmsLayer: "GAS_DATA:main_pipelinedevice",
        },
        junction: {
          name: "Pipeline Junction",
          visible: true,
          wmsLayer: "GAS_DATA:main_pipelinejunction",
        },
        line: {
          name: "Pipeline Line",
          visible: true,
          wmsLayer: "GAS_DATA:main_pipelineline",
        },
        structureboundary: {
          name: "Structure Boundary",
          visible: true,
          wmsLayer: "GAS_DATA:main_structureboundary",
        },
        structurejunction: {
          name: "Structure Junction",
          visible: true,
          wmsLayer: "GAS_DATA:main_structurejunction",
        },
      },
    },
  });
  const layerGroupsRef = useRef(layerGroups);
  // Basemap config
  const baseMaps = {
    osm: {
      name: "OpenStreetMap",
      layer: () =>
        new TileLayer({
          source: new OSM({ crossOrigin: "anonymous" }),
        }),
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
  const wmsLayersRef = useRef({});
  const layerExtentsRef = useRef({});
  const layerNamesRef = useRef({});
  const drawInteractionRef = useRef(null);
  const measureLayerRef = useRef(null);
  const drawLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setTarget(null);
      mapInstanceRef.current = null;
    }

    const osmLayer = new TileLayer({
      source: new OSM({
        crossOrigin: "anonymous",
      }),
      name: "osm",
    });
    baseLayerRef.current = osmLayer;

    const vectorSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: vectorSource,
      name: "markers",
    });
    markerLayerRef.current = markerLayer;

    // Selection layer for highlighting clicked features
    const selectionSource = new VectorSource();
    const selectionLayer = new VectorLayer({
      source: selectionSource,
      name: "selection",
      style: (feature) => {
        const geomType = feature.getGeometry()?.getType();
        if (geomType === "Point" || geomType === "MultiPoint") {
          return new Style({
            image: new CircleStyle({
              radius: 10,
              fill: new Fill({ color: "rgba(0, 191, 255, 0.3)" }),
              stroke: new Stroke({ color: "#00BFFF", width: 4 }),
            }),
          });
        }
        // Lines + Polygons - cyan bold outline
        return new Style({
          stroke: new Stroke({ color: "#00BFFF", width: 4 }),
          fill: new Fill({ color: "rgba(0, 191, 255, 0.15)" }),
        });
      },
      zIndex: 999,
    });
    selectionLayerRef.current = selectionLayer;

    const wmsLayers = createWMSLayers();

    const map = new Map({
      target: mapRef.current,
      layers: [osmLayer, ...wmsLayers, selectionLayer, markerLayer],
      controls: [],
      view: new View({
        center: fromLonLat([76.993869, 28.448841]),
        zoom: 10,
        maxZoom: 20,
        minZoom: 2,
        constrainResolution: true,
      }),
      pixelRatio: window.devicePixelRatio || 1,
    });

    mapInstanceRef.current = map;
    map
      .getInteractions()
      .getArray()
      .forEach((interaction) => {
        if (interaction.constructor.name === "DragPan") {
          interaction.condition_ = (e) =>
            e.originalEvent.button === 1 || !e.originalEvent.button;
        }
      });

    // draw tab
    // Draw Layer setup
    const drawSource = new VectorSource();
    const drawVector = new VectorLayer({
      source: drawSource,
      style: new Style({
        fill: new Fill({ color: "rgba(255, 0, 0, 0.2)" }),
        stroke: new Stroke({ color: "#ff0000", width: 2 }),
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#ff0000" }),
          stroke: new Stroke({ color: "white", width: 2 }),
        }),
      }),
      zIndex: 998,
    });
    drawLayerRef.current = drawVector;
    map.addLayer(drawVector);
    // draw tab end

    // Asset search

    // Asset Buffer Layer
    const bufferSource = new VectorSource();
    const bufferLayer = new VectorLayer({
      source: bufferSource,
      style: new Style({
        fill: new Fill({ color: "rgba(79, 129, 179, 0.1)" }),
        stroke: new Stroke({ color: "#1976d2 ", width: 2, lineDash: [6, 4] }),
      }),
      zIndex: 997,
    });
    assetBufferLayerRef.current = bufferLayer;
    map.addLayer(bufferLayer);

    // Asset Point Layer
    const assetPointSource = new VectorSource();
    const assetPointLayer = new VectorLayer({
      source: assetPointSource,
      style: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "#1976d2" }),
          stroke: new Stroke({ color: "white", width: 2 }),
        }),
      }),
      zIndex: 999,
    });
    assetPointLayerRef.current = assetPointLayer;
    map.addLayer(assetPointLayer);
    // asset search end

    // Popup overlay create karo
    const popupElement = document.getElementById("popup-container");
    if (popupElement) {
      const overlay = new Overlay({
        element: popupElement,
        positioning: "bottom-center",
        offset: [0, -20],
        stopEvent: false,
        autoPan: {
          animation: { duration: 250 },
          margin: 30, // ← map ke andar 30px gap rakhega
        },
      });
      overlayRef.current = overlay;
      map.addOverlay(overlay);
    }

    setTimeout(() => {
      map.updateSize();
    }, 100);

    // map.on("pointermove", (evt) => {
    //   const coords = toLonLat(evt.coordinate);
    //   if (coordFormat === "latlon") {
    //     setCoordinates({
    //       x: coords[1].toFixed(6), // latitude
    //       y: coords[0].toFixed(6), // longitude
    //     });
    //   } else {
    //     setCoordinates({
    //       x: coords[0].toFixed(6),
    //       y: coords[1].toFixed(6),
    //     });
    //   }
    // });

    map.on("moveend", () => {
      const view = map.getView();
      const resolution = view.getResolution();
      const units = view.getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = units === "degrees" ? 111194.87428468118 : 1;
      const calculatedScale = Math.round(resolution * mpu * 39.37 * dpi);
      setScale(calculatedScale.toString());
      setScaleInput(calculatedScale.toString());
    });

    // Map click handler - Multiple features ke liye
    map.on("singleclick", async (evt) => {
      if (isDrawingActiveRef.current) return;
      if (isZoomingToFeatureRef.current) {
        isZoomingToFeatureRef.current = false;
        return;
      }
      if (isPopupClosingRef.current) {
        isPopupClosingRef.current = false;
        return;
      }

      // asset search
      if (isAssetSelectingRef.current) {
        const lonLat = toLonLat(evt.coordinate);
        const point = {
          lon: lonLat[0],
          lat: lonLat[1],
          coordinate: evt.coordinate,
        };
        setIncidentPoint(point);
        if (assetPointLayerRef.current) {
          assetPointLayerRef.current.getSource().clear();
          const marker = new Feature({ geometry: new Point(evt.coordinate) });
          assetPointLayerRef.current.getSource().addFeature(marker);
        }
        isAssetSelectingRef.current = false;
        setAssetSearchMode("idle");
        return;
      }
      // asset search end

      const viewResolution = map.getView().getResolution();
      const coordinate = evt.coordinate;

      // Clear previous selection only if no attribute table rows are selected
      // Always clear previous selection on new click
      if (selectionLayerRef.current) {
        selectionLayerRef.current.getSource().clear();
        selectionLayerRef.current.changed();
      }

      // Saare visible WMS layers check karo
      // Saare visible WMS layers check karo
      const seenLayers = new Set();
      const visibleLayers = Object.entries(wmsLayersRef.current).filter(
        ([key, layer]) => {
          if (!layer.getVisible()) return false;
          if (seenLayers.has(layer)) return false;
          seenLayers.add(layer);

          for (const [groupKey, group] of Object.entries(
            layerGroupsRef.current,
          )) {
            if (!group.visible) continue;
            for (const [lKey, lLayer] of Object.entries(group.children)) {
              if (lLayer.children) {
                for (const [nKey, nLayer] of Object.entries(lLayer.children)) {
                  if (nKey === key && !nLayer.visible) return false;
                }
              } else {
                if (lKey === key && !lLayer.visible) return false;
              }
            }
          }
          return true;
        },
      );

      if (visibleLayers.length === 0) {
        setPopupOpen(false);
        setAllPopupFeatures([]);
        overlayRef.current?.setPosition(undefined);
        return;
      }

      // Saari requests PARALLEL bhejo - fast!
      const results = await Promise.all(
        visibleLayers.map(async ([key, layer]) => {
          const source = layer.getSource();
          const wmsLayerName = layerExtentsRef.current[key];
          if (!wmsLayerName) return [];

          const sourceParams = source.getParams();
          const sourceLayers = sourceParams?.LAYERS || "";
          if (sourceLayers && !sourceLayers.split(",").includes(wmsLayerName))
            return [];

          const sourceUrls = source.getUrls?.() || [source.getUrl?.()];
          const baseUrl = sourceUrls[0];
          const mapSize = mapInstanceRef.current.getSize();
          const extent = mapInstanceRef.current
            .getView()
            .calculateExtent(mapSize);
          const pixel =
            mapInstanceRef.current.getPixelFromCoordinate(coordinate);

          const params = new URLSearchParams({
            SERVICE: "WMS",
            VERSION: "1.1.1",
            REQUEST: "GetFeatureInfo",
            LAYERS: wmsLayerName,
            QUERY_LAYERS: wmsLayerName,
            INFO_FORMAT: "application/json",
            SRS: "EPSG:3857",
            BBOX: extent.join(","),
            WIDTH: mapSize[0],
            HEIGHT: mapSize[1],
            X: Math.round(pixel[0]),
            Y: Math.round(pixel[1]),
            FEATURE_COUNT: 10,
          });

          try {
            const response = await fetch(`${baseUrl}?${params}`);
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              return data.features.map((feature) => ({
                layerName:
                  layerNamesRef.current[key] ||
                  layerExtentsRef.current[key] ||
                  key,
                properties: feature.properties,
                geometry: feature.geometry,
                layerKey: key,
              }));
            }
          } catch (error) {
            console.error("Feature info error:", error);
          }
          return [];
        }),
      );

      const allFeatures = results.flat();

      // Yeh pura purana block DELETE karo - opening brace se leke closing brace tak:

      if (allFeatures.length > 0) {
        setAllPopupFeatures(allFeatures);
        setPopupOpen(true);
        setExpandedAttributes(
          allFeatures.length === 1 ? { "feature-0": true } : {},
        );

        // ✅ Popup ko map click pixel position pe le jao
        const mapSize = mapInstanceRef.current.getSize();
        const pixel = mapInstanceRef.current.getPixelFromCoordinate(coordinate);

        // Map container ka bounding rect nikalo
        const mapRect = mapRef.current.getBoundingClientRect();

        // Absolute position calculate karo
        const absX = mapRect.left + pixel[0];
        const absY = mapRect.top + pixel[1];

        // Popup ko right/bottom dikhao by default, edge pe adjust karo
        const popupW = 360;
        const popupH = 320;

        let finalX = absX + 15;
        let finalY = absY + 15;

        // Right edge check
        if (finalX + popupW > window.innerWidth) {
          finalX = absX - popupW - 15;
        }
        // Bottom edge check
        if (finalY + popupH > window.innerHeight) {
          finalY = absY - popupH - 15;
        }

        setPopupPosition({ x: finalX, y: finalY });

        // Overlay ki zaroorat nahi ab
        if (overlayRef.current) {
          overlayRef.current.setPosition(undefined);
        }

        // ✅ SELECTION - WFS se geometry fetch karo (reliable)
        if (selectionLayerRef.current) {
          const selectionSource = selectionLayerRef.current.getSource();
          selectionSource.clear();
          selectionLayerRef.current.changed();
          const geojsonFormat = new GeoJSON();

          for (const feature of allFeatures) {
            const wmsLayerName = layerExtentsRef.current[feature.layerKey];
            if (!wmsLayerName || !feature.properties) continue;

            // Step 1: Agar GetFeatureInfo mein geometry hai to seedha use karo
            if (feature?.geometry && feature.geometry.coordinates) {
              try {
                const olFeature = geojsonFormat.readFeature(
                  { type: "Feature", geometry: feature.geometry },
                  {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:3857",
                  },
                );
                selectionSource.addFeature(olFeature);
                selectionLayerRef.current.changed();
              } catch (e) {
                console.error("Geometry parse error:", e);
              }
            }

            // Step 2: WFS se fetch karo - OBJECTID priority
            const propEntries = Object.entries(feature.properties);

            // Best identifier field dhundo
            // ✅ Exact case field names directly from properties object
            const propKeys = Object.keys(feature.properties);

            // Priority order: objectid > gid > fid > numeric field
            const idCandidates = ["objectid", "gid", "fid", "id"];
            let idFieldName = null;

            for (const candidate of idCandidates) {
              const match = propKeys.find(
                (k) =>
                  k.toLowerCase() === candidate &&
                  feature.properties[k] !== null &&
                  feature.properties[k] !== undefined &&
                  feature.properties[k] !== "",
              );
              if (match) {
                idFieldName = match;
                break;
              }
            }

            // Fallback: koi bhi numeric field
            // ⚠️ Only use numeric fallback if value is UNIQUE enough (large number)
            if (!idFieldName) {
              idFieldName = propKeys.find(
                (k) =>
                  k !== "the_geom" &&
                  k !== "cat" && // ← category fields skip karo
                  k !== "type" &&
                  feature.properties[k] !== null &&
                  feature.properties[k] !== undefined &&
                  feature.properties[k] !== "" &&
                  !isNaN(Number(feature.properties[k])) &&
                  Number(feature.properties[k]) > 100, // ← sirf large numbers = likely unique IDs
              );
            }

            // ✅ ID nahi mili to WFS skip karo - geometry Step 1 mein already add ho gayi
            if (!idFieldName) continue;

            const idValue = feature.properties[idFieldName];
            const isNum =
              !isNaN(Number(idValue)) && idValue !== null && idValue !== "";
            if (idValue === null || idValue === undefined || idValue === "")
              continue;
            const filterVal = isNum ? Number(idValue) : `'${idValue}'`;

            console.log(
              `✅ Highlight filter EXACT: ${idFieldName} = ${filterVal}`,
            );

            console.log(
              `✅ Highlight filter EXACT: ${idFieldName} = ${filterVal} on ${wmsLayerName}`,
            );
            const params = new URLSearchParams({
              ...DEFAULT_WFS_PARAMS,
              typeName: wmsLayerName,
              CQL_FILTER: `${idFieldName} = ${filterVal}`,
              maxFeatures: 1,
            });

            // ✅ Capture current selectionSource in closure
            const capturedSource = selectionSource;
            const capturedLayer = selectionLayerRef.current;

            fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`)
              .then((r) => r.json())
              .then((data) => {
                if (data.features?.length > 0) {
                  const olFeatures = geojsonFormat.readFeatures(data, {
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:3857",
                  });
                  capturedSource.addFeatures(olFeatures);
                  capturedLayer.changed();
                }
              })
              .catch((e) => console.error("WFS highlight error:", e));
          }
        }
      } else {
        setPopupOpen(false);
        setAllPopupFeatures([]);
        overlayRef.current?.setPosition(undefined);
        // Empty area click pe selection clear karo
        if (selectionLayerRef.current) {
          selectionLayerRef.current.getSource().clear();
          selectionLayerRef.current.changed();
        }
      }
    });
    // Handle pointer move for coordinates
    const handlePointerMove = (evt) => {
      const coords = toLonLat(evt.coordinate);
      if (coordFormat === "latlon") {
        setCoordinates({
          x: coords[1].toFixed(6), // latitude
          y: coords[0].toFixed(6), // longitude
        });
      } else {
        setCoordinates({
          x: coords[0].toFixed(6),
          y: coords[1].toFixed(6),
        });
      }
    };

    map.on("pointermove", handlePointerMove);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.un("pointermove", handlePointerMove);
        mapInstanceRef.current.setTarget(null);
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current.updateSize();
      }, 300);
    }
  }, [drawerOpen]);

  useEffect(() => {
    selectedRowsRef.current = selectedRows;
  }, [selectedRows]);
  useEffect(() => {
    layerGroupsRef.current = layerGroups;
  }, [layerGroups]);

  // Update coordinate format listener
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    const handlePointerMove = (evt) => {
      const coords = toLonLat(evt.coordinate);
      if (coordFormat === "latlon") {
        setCoordinates({
          x: coords[1].toFixed(6),
          y: coords[0].toFixed(6),
        });
      } else {
        setCoordinates({
          x: coords[0].toFixed(6),
          y: coords[1].toFixed(6),
        });
      }
    };

    map.on("pointermove", handlePointerMove);

    return () => {
      map.un("pointermove", handlePointerMove);
    };
  }, [coordFormat]);

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

  // ============================================
  // PRINT FUNCTIONS - UPDATED
  // ============================================

  // Generate Main Map Image
  // Generate Main Map Image - OPENLAYERS NATIVE METHOD
  // ============================================
  // PRINT FUNCTIONS - OPENLAYERS NATIVE EXPORT
  // ============================================

  // Generate Main Map Image
  const generatePrintMap = () => {
    if (!mapRef.current || !mapInstanceRef.current) return null;

    return new Promise((resolve) => {
      const map = mapInstanceRef.current;

      map.once("rendercomplete", () => {
        try {
          const mapCanvas = document.createElement("canvas");
          const size = map.getSize();
          mapCanvas.width = size[0];
          mapCanvas.height = size[1];
          const mapContext = mapCanvas.getContext("2d");

          // White background
          mapContext.fillStyle = "#ffffff";
          mapContext.fillRect(0, 0, size[0], size[1]);

          // Get all canvas elements from the map container
          const canvases = mapRef.current.querySelectorAll("canvas");

          canvases.forEach((canvas) => {
            if (canvas.width > 0 && canvas.height > 0) {
              const opacity = canvas.parentNode.style.opacity;
              mapContext.globalAlpha = opacity === "" ? 1 : Number(opacity);

              // Handle CSS transform
              const transform = canvas.style.transform;
              if (transform && transform.includes("matrix")) {
                const matrix = transform
                  .match(/matrix\(([^)]+)\)/)[1]
                  .split(",")
                  .map(Number);
                mapContext.setTransform(...matrix);
              } else {
                mapContext.setTransform(1, 0, 0, 1, 0, 0);
              }

              mapContext.drawImage(canvas, 0, 0);
            }
          });

          mapContext.globalAlpha = 1;
          mapContext.setTransform(1, 0, 0, 1, 0, 0);

          resolve(mapCanvas.toDataURL("image/png"));
        } catch (error) {
          console.error("Export error:", error);
          resolve(null);
        }
      });

      map.renderSync();
    });
  };

  // Generate Inset Map
  const generateInsetMap = async () => {
    if (!mapInstanceRef.current) return null;

    const map = mapInstanceRef.current;
    const view = map.getView();
    const currentCenter = view.getCenter();
    const currentZoom = view.getZoom();

    view.setZoom(currentZoom - 4);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const insetImage = await generatePrintMap();

    view.setCenter(currentCenter);
    view.setZoom(currentZoom);

    return insetImage;
  };

  // Handle Print Preview
  const handlePrintPreview = async () => {
    setPrintGenerating(true);

    const mapImage = await generatePrintMap();
    const insetImage = await generateInsetMap();

    if (mapImage) {
      setPrintMapImage(mapImage);
      setPrintInsetImage(insetImage);
      setPrintPreviewOpen(true);
    } else {
      alert("Unable to generate map preview. Please try again.");
    }

    setPrintGenerating(false);
  };

  // Handle Download - keep existing code
  const handleDownload = () => {
    const container = document.getElementById("print-container");
    if (!container) return;

    import("html2canvas").then((html2canvas) => {
      html2canvas
        .default(container, {
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale: 2,
        })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `map_${Date.now()}.${printFormat.toLowerCase()}`;

          if (printFormat === "PDF") {
            import("jspdf").then((jsPDF) => {
              const pdf = new jsPDF.default({
                orientation: printTemplate,
                unit: "mm",
                format: printPage.toLowerCase(),
              });

              const imgData = canvas.toDataURL("image/png");
              const pdfWidth = pdf.internal.pageSize.getWidth();
              const pdfHeight = pdf.internal.pageSize.getHeight();

              pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
              pdf.save(link.download);
            });
          } else {
            const mimeType = printFormat === "PNG" ? "image/png" : "image/jpeg";
            link.href = canvas.toDataURL(mimeType, 0.95);
            link.click();
          }

          setPrintPreviewOpen(false);
        });
    });
  };

  // Get current scale - keep existing
  const getCurrentScale = () => {
    return `1:${scale}`;
  };

  // Get visible layers for legend
  const getVisibleLayersForLegend = () => {
    const visibleLayers = [];

    Object.entries(layerGroups).forEach(([groupKey, group]) => {
      Object.entries(group.children).forEach(([layerKey, layer]) => {
        if (layer.children) {
          // Nested layers
          Object.entries(layer.children).forEach(([nestedKey, nestedLayer]) => {
            if (nestedLayer.visible) {
              visibleLayers.push({
                name: nestedLayer.name,
                wmsLayer: nestedLayer.wmsLayer,
                wmsUrl: layer.wmsUrl || GEOSERVER_CONFIG.wmsUrl, // ✅ YE ADD KARO
              });
            }
          });
        } else {
          // Direct child layers
          if (layer.visible) {
            visibleLayers.push({
              name: layer.name,
              wmsLayer: layer.wmsLayer,
              wmsUrl: layer.wmsUrl || "https://gis.mapgeoid.com/geoserver/wms", // ✅ YE ADD KARO
            });
          }
        }
      });
    });

    return visibleLayers;
  };

  // ============================================
  // PRINT FUNCTIONS - OPENLAYERS NATIVE EXPORT
  // ============================================

  // Generate Print Map Image
  // const generatePrintMap = () => {
  //   if (!mapRef.current || !mapInstanceRef.current) return null;

  //   return new Promise((resolve) => {
  //     const map = mapInstanceRef.current;

  //     map.once("rendercomplete", () => {
  //       try {
  //         // Create export canvas
  //         const exportCanvas = document.createElement("canvas");
  //         const size = map.getSize();
  //         exportCanvas.width = size[0];
  //         exportCanvas.height = size[1];
  //         const context = exportCanvas.getContext("2d");

  //         // Combine all map canvases
  //         const canvases = mapRef.current.querySelectorAll(
  //           ".ol-layer canvas, canvas.ol-layer",
  //         );

  //         canvases.forEach((canvas) => {
  //           if (canvas.width > 0) {
  //             const opacity = canvas.parentNode.style.opacity || 1;
  //             context.globalAlpha = parseFloat(opacity);

  //             // Draw canvas
  //             const transform = canvas.style.transform;
  //             if (transform) {
  //               // Parse matrix transform
  //               const matrix = transform
  //                 .match(/^matrix\(([^)]+)\)/)?.[1]
  //                 .split(",")
  //                 .map(Number);

  //               if (matrix && matrix.length === 6) {
  //                 context.setTransform(
  //                   matrix[0],
  //                   matrix[1],
  //                   matrix[2],
  //                   matrix[3],
  //                   matrix[4],
  //                   matrix[5],
  //                 );
  //               }
  //             }

  //             context.drawImage(canvas, 0, 0);
  //             context.setTransform(1, 0, 0, 1, 0, 0);
  //           }
  //         });

  //         context.globalAlpha = 1;
  //         resolve(exportCanvas.toDataURL("image/png"));
  //       } catch (error) {
  //         console.error("Export error:", error);
  //         resolve(null);
  //       }
  //     });

  //     // Trigger render
  //     map.renderSync();
  //   });
  // };

  // Handle Print Preview
  // const handlePrintPreview = async () => {
  //   setPrintGenerating(true);

  //   const mapImage = await generatePrintMap();

  //   if (mapImage) {
  //     setPrintMapImage(mapImage);
  //     setPrintPreviewOpen(true);
  //   } else {
  //     alert("Unable to generate map preview. Please try again.");
  //   }

  //   setPrintGenerating(false);
  // };

  // Handle Print
  // const handlePrint = () => {
  //   window.print();
  //   setPrintPreviewOpen(false);
  // };

  // Get current scale
  // const getCurrentScale = () => {
  //   return `1:${scale}`;
  // };

  // // Get visible layers for legend
  // const getVisibleLayersForLegend = () => {
  //   const visibleLayers = [];

  //   Object.entries(layerGroups).forEach(([groupKey, group]) => {
  //     Object.entries(group.children).forEach(([layerKey, layer]) => {
  //       if (layer.visible) {
  //         visibleLayers.push({
  //           name: layer.name,
  //           wmsLayer: layer.wmsLayer,
  //         });
  //       }
  //     });
  //   });

  //   return visibleLayers;
  // };

  // Create WMS layers from layer groups
  const createWMSLayers = () => {
    const layers = [];

    Object.entries(layerGroups).forEach(([groupKey, group]) => {
      const byUrl = {};

      const collectGroupLayers = (children) => {
        Object.entries(children).forEach(([key, layer]) => {
          if (layer.children) {
            collectGroupLayers(layer.children);
          } else if (layer.wmsLayer) {
            const url =
              layer.wmsUrl || "https://gis.mapgeoid.com/geoserver/wms";
            if (!byUrl[url]) byUrl[url] = [];
            byUrl[url].push({
              key,
              layerName: layer.wmsLayer,
              friendlyName: layer.name,
              visible: layer.visible,
            });
          }
        });
      };

      collectGroupLayers(group.children);

      Object.entries(byUrl).forEach(([url, groupLayers]) => {
        groupLayers.forEach((info) => {
          const tileLayer = new TileLayer({
            source: new TileWMS({
              url,
              params: {
                LAYERS: info.layerName,
                FORMAT: "image/png8",
                TRANSPARENT: true,
                TILED: true,
              },
              serverType: "geoserver",
              crossOrigin: "anonymous",
              transition: 0,
            }),
            visible: info.visible,
            preload: 2,
          });

          wmsLayersRef.current[info.key] = tileLayer;
          layerExtentsRef.current[info.key] = info.layerName;
          layerNamesRef.current[info.key] = info.friendlyName;

          layers.push(tileLayer);
        });
      });
    });

    return layers;
  };

  const toggleLayerVisibility = (groupKey, layerKey, nestedKey = null) => {
    setLayerGroups((prev) => {
      const newGroups = JSON.parse(JSON.stringify(prev));

      if (nestedKey) {
        newGroups[groupKey].children[layerKey].children[nestedKey].visible =
          !newGroups[groupKey].children[layerKey].children[nestedKey].visible;
      } else {
        newGroups[groupKey].children[layerKey].visible =
          !newGroups[groupKey].children[layerKey].visible;
      }

      const targetKey = nestedKey || layerKey;
      const olLayer = wmsLayersRef.current[targetKey];

      if (olLayer) {
        const relatedLayers = [];

        Object.entries(newGroups[groupKey].children).forEach(
          ([lKey, layer]) => {
            if (layer.children) {
              Object.entries(layer.children).forEach(([nKey, nestedLayer]) => {
                if (wmsLayersRef.current[nKey] === olLayer) {
                  relatedLayers.push({
                    layerName: nestedLayer.wmsLayer,
                    visible: nestedLayer.visible,
                  });
                }
              });
            } else {
              if (wmsLayersRef.current[lKey] === olLayer) {
                relatedLayers.push({
                  layerName: layer.wmsLayer,
                  visible: layer.visible,
                });
              }
            }
          },
        );

        // ✅ GROUP OFF HAI TO LAYER KABHI SHOW MAT KARO
        const groupVisible = newGroups[groupKey].visible;

        const targetVisible = nestedKey
          ? newGroups[groupKey].children[layerKey].children[nestedKey].visible
          : newGroups[groupKey].children[layerKey].visible;

        if (!groupVisible || !targetVisible) {
          olLayer.setVisible(false);
        } else {
          olLayer.setVisible(true);
        }
      }

      return newGroups;
    });
  };

  const toggleGroupVisibility = (groupKey) => {
    setLayerGroups((prev) => {
      const newGroups = JSON.parse(JSON.stringify(prev));
      const newVisibility = !newGroups[groupKey].visible;
      newGroups[groupKey].visible = newVisibility;

      const uniqueLayers = new Set();

      Object.entries(newGroups[groupKey].children).forEach(
        ([layerKey, layer]) => {
          if (layer.children) {
            Object.entries(layer.children).forEach(
              ([nestedKey, nestedLayer]) => {
                newGroups[groupKey].children[layerKey].children[
                  nestedKey
                ].visible = newVisibility;
                const olLayer = wmsLayersRef.current[nestedKey];
                if (olLayer) uniqueLayers.add(olLayer);
              },
            );
          } else {
            newGroups[groupKey].children[layerKey].visible = newVisibility;
            const olLayer = wmsLayersRef.current[layerKey];
            if (olLayer) uniqueLayers.add(olLayer);
          }
        },
      );

      uniqueLayers.forEach((olLayer) => {
        if (!newVisibility) {
          olLayer.setVisible(false);
        } else {
          const visibleNames = [];
          Object.entries(newGroups[groupKey].children).forEach(
            ([lKey, layer]) => {
              if (layer.children) {
                Object.entries(layer.children).forEach(([nKey, nl]) => {
                  if (wmsLayersRef.current[nKey] === olLayer && nl.visible) {
                    visibleNames.push(nl.wmsLayer);
                  }
                });
              } else if (
                wmsLayersRef.current[lKey] === olLayer &&
                layer.visible
              ) {
                visibleNames.push(layer.wmsLayer);
              }
            },
          );

          if (visibleNames.length > 0) {
            olLayer.setVisible(true); // LAYERS param mat badlo
          } else {
            olLayer.setVisible(false); // ← YAHAN false hona chahiye
          }
        }
      });

      return newGroups;
    });
  };

  const toggleGroupExpanded = (groupKey) => {
    setLayerGroups((prev) => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        expanded: !prev[groupKey].expanded,
      },
    }));
  };

  const toggleNestedExpanded = (groupKey, layerKey) => {
    setLayerGroups((prev) => {
      const newGroups = JSON.parse(JSON.stringify(prev));
      newGroups[groupKey].children[layerKey].expanded =
        !newGroups[groupKey].children[layerKey].expanded;
      return newGroups;
    });
  };

  const handleLayerMenuClick = (
    event,
    groupKey,
    layerKey,
    nestedKey = null,
  ) => {
    event.stopPropagation();
    setLayerMenuAnchor(event.currentTarget);
    setSelectedLayer({ groupKey, layerKey, nestedKey });
  };

  const handleLayerMenuClose = () => {
    setLayerMenuAnchor(null);
    setSelectedLayer(null);
  };

  const handleZoomToLayer = async () => {
    const { groupKey, layerKey, nestedKey } = selectedLayer;
    const targetKey = nestedKey || layerKey;
    const wmsLayerName = layerExtentsRef.current[targetKey];

    if (!wmsLayerName) {
      alert("Layer information not found");
      handleLayerMenuClose();
      return;
    }

    try {
      // ✅ YE NAYA CODE
      const layer = layerGroups[groupKey].children[layerKey];
      const actualLayer = nestedKey ? layer.children[nestedKey] : layer;
      const wfsUrl = GEOSERVER_CONFIG.getWfsUrlForLayer(actualLayer.wmsUrl);
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        // maxFeatures: 1000,
      });
      const response = await fetch(`${wfsUrl}?${params}`);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();

      // ✅ DEBUGGING CONSOLE (optional, baad me remove kar sakte ho)
      console.log("WFS Response:", data);

      if (!data.features || data.features.length === 0) {
        alert("No features found in this layer");
        handleLayerMenuClose();
        return;
      }

      // ✅ Check if all features have valid geometries
      const validFeatures = data.features.filter(
        (f) => f.geometry && f.geometry.coordinates,
      );
      if (validFeatures.length === 0) {
        alert("Layer has no valid geometries");
        handleLayerMenuClose();
        return;
      }

      const geojsonFormat = new GeoJSON();
      const features = geojsonFormat.readFeatures(data, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });

      // ✅ Calculate combined extent with better handling
      let combinedExtent = null;
      let pointCount = 0;
      let pointCenter = null;

      features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry) {
          const geomType = geometry.getType();

          // Special handling for Point geometries
          if (geomType === "Point") {
            pointCount++;
            pointCenter = geometry.getCoordinates();
          }

          const featureExtent = geometry.getExtent();

          // Check if extent has real values
          if (featureExtent.every((val) => isFinite(val))) {
            if (!combinedExtent) {
              combinedExtent = [...featureExtent];
            } else {
              combinedExtent[0] = Math.min(combinedExtent[0], featureExtent[0]);
              combinedExtent[1] = Math.min(combinedExtent[1], featureExtent[1]);
              combinedExtent[2] = Math.max(combinedExtent[2], featureExtent[2]);
              combinedExtent[3] = Math.max(combinedExtent[3], featureExtent[3]);
            }
          }
        }
      });

      const view = mapInstanceRef.current.getView();

      // ✅ If only points and extent is too small, use center + zoom
      if (
        pointCount > 0 &&
        (!combinedExtent || !isValidExtent(combinedExtent))
      ) {
        view.animate({
          center: pointCenter,
          zoom: 16,
          duration: 800,
        });
      } else if (combinedExtent && isValidExtent(combinedExtent)) {
        // Check if extent is too small (might be single point)
        const [minX, minY, maxX, maxY] = combinedExtent;
        const width = maxX - minX;
        const height = maxY - minY;

        if (width < 10 && height < 10) {
          // Very small extent, use center + fixed zoom
          const centerX = (minX + maxX) / 2;
          const centerY = (minY + maxY) / 2;
          view.animate({
            center: [centerX, centerY],
            // zoom: 16,
            duration: 800,
          });
        } else {
          // Normal extent fit
          view.fit(combinedExtent, {
            padding: [50, 50, 50, 50],
            duration: 800,
            // maxZoom: 18,
          });
        }
      } else {
        alert("Unable to calculate valid extent");
        handleLayerMenuClose();
        return;
      }
    } catch (error) {
      console.error("Zoom error:", error);
      alert(`Unable to zoom: ${error.message}`);
    }
    handleLayerMenuClose();
  };
  // ✅ GeoServer se exact field names fetch karo
  const fetchExactFieldNames = async (wmsLayerName) => {
    try {
      const params = new URLSearchParams({
        service: "WFS",
        version: "1.0.0",
        request: "DescribeFeatureType",
        typeName: wmsLayerName,
        outputFormat: "application/json",
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();
      console.log("DescribeFeatureType response:", data);
      // Field names nikalo
      const props = data?.featureTypes?.[0]?.properties || [];
      return props.map((p) => p.name);
    } catch (e) {
      console.error("DescribeFeatureType error:", e);
      return [];
    }
  };

  // Zoom to specific feature - Fixed with error handling
  const handleZoomToFeature = async (featureData) => {
    if (!mapInstanceRef.current) return;

    const geojsonFormat = new GeoJSON();
    const wmsLayerName = layerExtentsRef.current[featureData.layerKey];
    if (!wmsLayerName || !featureData.properties) return;

    const zoomAndSelect = (olFeature) => {
      isZoomingToFeatureRef.current = true;
      const geometry = olFeature.getGeometry();
      if (!geometry) return;

      const view = mapInstanceRef.current.getView();
      const geomType = geometry.getType();

      if (selectionLayerRef.current) {
        selectionLayerRef.current.getSource().clear();
        selectionLayerRef.current.getSource().addFeature(olFeature);
        selectionLayerRef.current.changed();
      }

      // Har geometry type ke liye extent use karo
      const extent = geometry.getExtent();
      if (extent && extent.every((v) => isFinite(v))) {
        const [minX, minY, maxX, maxY] = extent;
        const width = maxX - minX;
        const height = maxY - minY;

        if (width < 1 && height < 1) {
          // Exact Point
          view.animate({
            center: [(minX + maxX) / 2, (minY + maxY) / 2],
            zoom: 16,
            duration: 800,
          });
        } else {
          // Line / Polygon — PURA feature screen pe fit karo
          view.fit(extent, {
            padding: [80, 80, 80, 80],
            duration: 800,
            // ← maxZoom bilkul nahi — OpenLayers khud fit karega
          });
        }
      }
    };

    // ✅ ALWAYS WFS se fetch karo - reliable geometry ke liye
    const props = featureData.properties;
    const propKeys = Object.keys(props);

    // ID field dhundo
    let idFieldName = null;
    const idCandidates = ["objectid", "gid", "fid", "id"];
    for (const candidate of idCandidates) {
      const match = propKeys.find(
        (k) =>
          k.toLowerCase() === candidate &&
          props[k] !== null &&
          props[k] !== undefined &&
          props[k] !== "",
      );
      if (match) {
        idFieldName = match;
        break;
      }
    }

    if (!idFieldName) {
      for (const k of propKeys) {
        if (
          k !== "the_geom" &&
          k !== "geom" &&
          props[k] !== null &&
          props[k] !== undefined &&
          props[k] !== "" &&
          !isNaN(Number(props[k]))
        ) {
          idFieldName = k;
          break;
        }
      }
    }

    if (!idFieldName) {
      // ✅ ID nahi hai to GetFeatureInfo ki geometry se hi zoom karo
      if (featureData?.geometry && featureData.geometry.coordinates) {
        const geojsonFormat = new GeoJSON();
        try {
          const olFeature = geojsonFormat.readFeature(
            { type: "Feature", geometry: featureData.geometry },
            { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" },
          );
          zoomAndSelect(olFeature);
        } catch (e) {
          console.warn("Geometry zoom error:", e);
        }
      }
      return;
    }

    const idValue = props[idFieldName];
    const isNum = !isNaN(Number(idValue)) && idValue !== null && idValue !== "";
    const filterVal = isNum ? Number(idValue) : `'${idValue}'`;

    console.log(
      `✅ Zoom filter: ${idFieldName} = ${filterVal} on ${wmsLayerName}`,
    );

    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        CQL_FILTER: `${idFieldName} = ${filterVal}`,
        maxFeatures: 1,
      });

      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();

      console.log("WFS zoom response features:", data.features?.length);
      console.log(
        "First feature objectid:",
        data.features?.[0]?.properties?.objectid,
      );

      if (data.features?.length > 0) {
        const olFeatures = geojsonFormat.readFeatures(data, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });
        if (olFeatures.length > 0) {
          zoomAndSelect(olFeatures[0]);
        }
      } else {
        console.warn("No feature found for:", idFieldName, filterVal);
      }
    } catch (e) {
      console.error("WFS zoom error:", e);
    }
  };

  const handleZoomToSelected = () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one row");
      return;
    }
    if (!mapInstanceRef.current) return;

    // Selected rows ke features nikalo (geometry ke saath)
    const selectedFeatures = attributeFeaturesRef.current.filter((_, idx) =>
      selectedRows.includes(idx),
    );

    if (selectedFeatures.length === 0) {
      alert("No geometry data found. Please reload the table.");
      return;
    }

    const geojsonFormat = new GeoJSON();
    const olFeatures = geojsonFormat.readFeatures(
      { type: "FeatureCollection", features: selectedFeatures },
      { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" },
    );

    // Selection layer update karo
    if (selectionLayerRef.current) {
      selectionLayerRef.current.getSource().clear();
      selectionLayerRef.current.getSource().addFeatures(olFeatures);
      selectionLayerRef.current.changed();
    }

    // Extent calculate karo
    let combinedExtent = null;
    olFeatures.forEach((f) => {
      const geom = f.getGeometry();
      if (!geom) return;
      const ext = geom.getExtent();
      if (ext && ext.every((v) => isFinite(v))) {
        if (!combinedExtent) {
          combinedExtent = [...ext];
        } else {
          combinedExtent[0] = Math.min(combinedExtent[0], ext[0]);
          combinedExtent[1] = Math.min(combinedExtent[1], ext[1]);
          combinedExtent[2] = Math.max(combinedExtent[2], ext[2]);
          combinedExtent[3] = Math.max(combinedExtent[3], ext[3]);
        }
      }
    });

    if (combinedExtent && isValidExtent(combinedExtent)) {
      const [minX, minY, maxX, maxY] = combinedExtent;
      const isPoint = maxX - minX < 10 && maxY - minY < 10;

      if (isPoint) {
        mapInstanceRef.current.getView().animate({
          center: [(minX + maxX) / 2, (minY + maxY) / 2],
          // zoom: 16,
          duration: 800,
        });
      } else {
        const [minX, minY, maxX, maxY] = combinedExtent;
        const width = maxX - minX;
        const height = maxY - minY;
        if (width < 1 && height < 1) {
          mapInstanceRef.current.getView().animate({
            center: [(minX + maxX) / 2, (minY + maxY) / 2],
            zoom: 15,
            duration: 800,
          });
        } else {
          mapInstanceRef.current.getView().fit(combinedExtent, {
            padding: [100, 100, 100, 100],
            duration: 800,
          });
        }
      }
    } else {
      alert("No geometry available to zoom");
    }
  };

  // Docked table resize handlers
  const handleDockedResizeStart = (e) => {
    e.preventDefault();
    setIsResizingDocked(true);
  };

  const handleDockedResizeMove = (e) => {
    if (isResizingDocked) {
      const windowHeight = window.innerHeight;
      const mouseY = e.clientY;
      const bottomBarHeight = 48; // Bottom scale bar height
      const minHeight = 150;

      // Calculate new height from bottom
      const newHeight = windowHeight - mouseY - bottomBarHeight;

      if (newHeight >= minHeight && newHeight <= windowHeight - 200) {
        setDockedTableHeight(newHeight);
      }
    }
  };

  const handleDockedResizeEnd = () => {
    setIsResizingDocked(false);
  };

  useEffect(() => {
    if (isResizingDocked) {
      document.addEventListener("mousemove", handleDockedResizeMove);
      document.addEventListener("mouseup", handleDockedResizeEnd);
    } else {
      document.removeEventListener("mousemove", handleDockedResizeMove);
      document.removeEventListener("mouseup", handleDockedResizeEnd);
    }
    return () => {
      document.removeEventListener("mousemove", handleDockedResizeMove);
      document.removeEventListener("mouseup", handleDockedResizeEnd);
    };
  }, [isResizingDocked]);

  const handleOpenAttributeTable = async () => {
    const { groupKey, layerKey, nestedKey } = selectedLayer;
    const targetKey = nestedKey || layerKey;
    const wmsLayerName = layerExtentsRef.current[targetKey];

    if (!wmsLayerName) {
      alert("Layer information not found");
      handleLayerMenuClose();
      return;
    }

    // ✅ Agar is layer ka query data already saved hai to wahi use karo
    if (
      selectedQueryLayer === targetKey &&
      attributeData.length > 0 &&
      attributeLayerName.includes(wmsLayerName)
    ) {
      // Query result already available - seedha table open karo
      setAttributeTableOpen(true);
      setAttributeTableDocked(true);
      setTablePage(0);
      handleLayerMenuClose();
      return;
    }

    // Nahi hai to fresh WFS fetch karo (existing code)
    setAttributeTableOpen(true);
    setAttributeLoading(true);
    setAttributeLayerName(layerNamesRef.current[targetKey] || wmsLayerName);
    handleLayerMenuClose();

    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
      });
      const response = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await response.json();

      if (data.features && data.features.length > 0) {
        const firstFeature = data.features[0].properties;
        const cols = Object.keys(firstFeature).map((key) => ({
          id: key,
          label: key.toUpperCase().replace(/_/g, " "),
        }));
        const rows = data.features.map((feature, index) => ({
          id: index,
          ...feature.properties,
        }));
        attributeFeaturesRef.current = data.features;
        setAttributeColumns(cols);
        setAttributeData(rows);
        setTablePage(0);
      } else {
        setAttributeColumns([]);
        setAttributeData([]);
        alert("No features found in this layer");
      }
    } catch (error) {
      console.error("Attribute table error:", error);
      alert("Unable to load attribute table.");
      setAttributeTableOpen(false);
    } finally {
      setAttributeLoading(false);
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
      },
    );
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
          searchQuery,
        )}`,
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
            value,
          )}&limit=5`,
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

  const handleSaveBookmark = () => {
    if (!bookmarkName.trim()) {
      alert("Please enter bookmark name");
      return;
    }

    // ✅ YE ADD KARO - DUPLICATE CHECK
    const isDuplicate = bookmarks.some(
      (bookmark) =>
        bookmark.name.toLowerCase() === bookmarkName.trim().toLowerCase(),
    );

    if (isDuplicate) {
      alert(
        "A bookmark with this name already exists. Please use a different name.",
      );
      return;
    }

    const view = mapInstanceRef.current?.getView();
    if (view) {
      const center = view.getCenter();
      const zoom = view.getZoom();
      const lonLat = toLonLat(center);

      const newBookmark = {
        id: Date.now(),
        name: bookmarkName,
        center: lonLat,
        zoom: zoom,
        date: new Date().toLocaleString(),
      };

      setBookmarks([...bookmarks, newBookmark]);
      setBookmarkName("");
      // setBookmarkDialogOpen(false);
    }
  };

  const handleGoToBookmark = (bookmark) => {
    const view = mapInstanceRef.current?.getView();
    if (view) {
      view.animate({
        center: fromLonLat(bookmark.center),
        zoom: bookmark.zoom,
        duration: 500,
      });
    }
  };

  const handleDeleteBookmark = (id) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
  };
  const updateMapSelectionFromRows = useCallback((newSelectedRows) => {
    if (!selectionLayerRef.current) return;
    const selSource = selectionLayerRef.current.getSource();
    selSource.clear();
    if (newSelectedRows.length === 0) {
      selectionLayerRef.current.changed();
      return;
    }
    const selectedFeats = attributeFeaturesRef.current.filter((_, idx) =>
      newSelectedRows.includes(idx),
    );
    if (selectedFeats.length === 0) return;
    const geojsonFormat = new GeoJSON();
    try {
      const olFeatures = geojsonFormat.readFeatures(
        { type: "FeatureCollection", features: selectedFeats },
        { dataProjection: "EPSG:4326", featureProjection: "EPSG:3857" },
      );
      selSource.addFeatures(olFeatures);
      selectionLayerRef.current.changed();
    } catch (e) {
      console.error("Selection update error:", e);
    }
  }, []); // ← empty dependency

  const fetchLayerFields = async (layerKey) => {
    const wmsLayerName = layerExtentsRef.current[layerKey];
    if (!wmsLayerName) return;
    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        maxFeatures: 1, // ← SIRF 1 FEATURE CHAHIYE FIELDS KE LIYE
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();
      if (data.features?.length > 0) {
        setQueryLayerFields(Object.keys(data.features[0].properties));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFieldValues = async (layerKey, fieldName, clauseId) => {
    const wmsLayerName = layerExtentsRef.current[layerKey];
    if (!wmsLayerName || !fieldName) return;
    setQueryFieldValuesLoading((prev) => ({ ...prev, [clauseId]: true }));
    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        // maxFeatures: 500,
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const unique = [
          ...new Set(
            data.features
              .map((f) => f.properties[fieldName])
              .filter((v) => v !== null && v !== undefined && v !== "")
              .map(String),
          ),
        ].sort();
        setQueryFieldValues((prev) => ({ ...prev, [clauseId]: unique }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setQueryFieldValuesLoading((prev) => ({ ...prev, [clauseId]: false }));
    }
  };

  const handleApplyQuery = async () => {
    if (!queryLayer) {
      alert("Please select a layer");
      return;
    }

    const wmsLayerName = layerExtentsRef.current[queryLayer];
    if (!wmsLayerName) return;

    // CQL Filter build karo
    const conditions = queryClauses
      .filter(
        (c) =>
          c.field &&
          (c.operator === "is blank" ||
            c.operator === "is not blank" ||
            c.value !== ""),
      )
      .map((c, idx) => {
        let condition = "";
        switch (c.operator) {
          case "is equal to":
            condition = `${c.field} = '${c.value}'`;
            break;
          case "is not equal to":
            condition = `${c.field} <> '${c.value}'`;
            break;
          case "is greater than":
            condition = `${c.field} > '${c.value}'`;
            break;
          case "is less than":
            condition = `${c.field} < '${c.value}'`;
            break;
          case "contains":
            condition = `${c.field} LIKE '%${c.value}%'`;
            break;
          case "starts with":
            condition = `${c.field} LIKE '${c.value}%'`;
            break;
          case "is blank":
            condition = `${c.field} IS NULL`;
            break;
          case "is not blank":
            condition = `${c.field} IS NOT NULL`;
            break;
          default:
            condition = `${c.field} = '${c.value}'`;
        }
        if (idx > 0) {
          const conj = c.conjunction === "Or" ? " OR " : " AND ";
          return conj + condition;
        }
        return condition;
      });

    if (conditions.length === 0) {
      alert("Please fill at least one condition");
      return;
    }

    let cqlFilter = conditions.join("");
    if (invertWhere) cqlFilter = `NOT (${cqlFilter})`;

    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        CQL_FILTER: cqlFilter,
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();

      if (!data.features || data.features.length === 0) {
        alert("No features found matching the query");
        return;
      }

      // ✅ 1. MAP PE HIGHLIGHT karo (selection layer mein)
      if (selectionLayerRef.current) {
        const selSource = selectionLayerRef.current.getSource();
        selSource.clear();
        const geojsonFormat = new GeoJSON();
        const features = geojsonFormat.readFeatures(data, {
          dataProjection: "EPSG:4326",
          featureProjection: "EPSG:3857",
        });
        selSource.addFeatures(features);
        selectionLayerRef.current.changed();

        // ✅ 2. ZOOM TO results
        const extent = selSource.getExtent();
        if (extent && isValidExtent(extent)) {
          const [minX, minY, maxX, maxY] = extent;
          if (maxX - minX < 1 && maxY - minY < 1) {
            mapInstanceRef.current.getView().animate({
              center: [(minX + maxX) / 2, (minY + maxY) / 2],
              zoom: 15,
              duration: 800,
            });
          } else {
            mapInstanceRef.current.getView().fit(extent, {
              padding: [100, 100, 100, 100],
              duration: 800,
            });
          }
        }
      }

      // ✅ 3. Query results ko ref mein save karo
      //    (Attribute table manually open karne pe ye data use hoga)
      const firstFeature = data.features[0].properties;
      const cols = Object.keys(firstFeature).map((key) => ({
        id: key,
        label: key.toUpperCase().replace(/_/g, " "),
      }));
      const rows = data.features.map((feature, index) => ({
        id: index,
        ...feature.properties,
      }));
      // Query results map pe highlight karo
      const queryIds = rows.map((r) => r.id);

      // Ab PURI layer fetch karo (bina filter ke) - ALL tab ke liye
      const allParams = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
      });
      const allRes = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${allParams}`);
      const allData = await allRes.json();

      const allRows = allData.features.map((feature, index) => ({
        id: index,
        ...feature.properties,
      }));

      attributeFeaturesRef.current = allData.features;
      setAttributeColumns(cols);
      setAttributeData(allRows); // ← Puri layer ke rows

      // Query result wale rows ko selected mark karo
      // (query features ke properties match karke)
      const queryRowIds = allRows
        .filter((row) =>
          rows.some((qr) =>
            attributeColumns.length > 0
              ? qr[attributeColumns[0]?.id] === row[attributeColumns[0]?.id]
              : false,
          ),
        )
        .map((r) => r.id);

      setAttributeLayerName(
        `${wmsLayerName} (Query: ${data.features.length} results)`,
      );
      setTablePage(0);
      setSelectedRows(queryRowIds);
      updateMapSelectionFromRows(queryRowIds);

      // ✅ 4. Layer panel mein us layer ko visually SELECTED dikhaao
      //    queryLayer state already set hai, use highlight ke liye use karo
      setSelectedQueryLayer(queryLayer); // naya state (neeche add karenge)

      // ✅ 5. Attribute table AUTO-OPEN NAHI hoga
      //    User manually layer menu se "Open Attribute Table" click karega
      //    Tab sirf layers tab pe le jao

      setAttributeTableOpen(true);
      setAttributeTableDocked(true);
      setTableViewMode("all");
    } catch (e) {
      console.error(e);
      alert("Query failed: " + e.message);
    }
  };

  const applyFilterToLayer = (layerKey, cqlFilter) => {
    const wmsLayerName = layerExtentsRef.current[layerKey];
    if (!wmsLayerName) return;

    const olLayer = wmsLayersRef.current[layerKey];
    if (!olLayer) return;

    // Check karo kitne keys is same TileLayer ko share kar rahe hain
    const sharedKeys = Object.keys(wmsLayersRef.current).filter(
      (k) => wmsLayersRef.current[k] === olLayer,
    );

    if (sharedKeys.length === 1) {
      // Sirf ek layer hai - directly CQL_FILTER lagao
      olLayer.getSource().updateParams({ CQL_FILTER: cqlFilter });
      olLayer.getSource().refresh();
    } else {
      // Multiple layers share kar rahe hain - naya alag TileLayer banao
      const layerUrl =
        olLayer.getSource().getUrls?.()?.[0] ||
        "https://gis.mapgeoid.com/geoserver/wms";

      const newTileLayer = new TileLayer({
        source: new TileWMS({
          url: layerUrl,
          params: {
            LAYERS: wmsLayerName,
            FORMAT: "image/png8",
            TRANSPARENT: true,
            TILED: true,
            CQL_FILTER: cqlFilter,
          },
          serverType: "geoserver",
          crossOrigin: "anonymous",
          transition: 0,
        }),
        visible: true,
        preload: 2,
        zIndex: olLayer.getZIndex() || 1,
      });

      // Original layer se is layerKey ko hatao (baaki layers same TileLayer use karte rahe)
      // Original layer ka LAYERS param update karo (is layer ko hatao)
      const remainingLayerNames = sharedKeys
        .filter((k) => k !== layerKey)
        .map((k) => layerExtentsRef.current[k])
        .join(",");

      if (remainingLayerNames) {
        olLayer.getSource().updateParams({ LAYERS: remainingLayerNames });
      } else {
        olLayer.setVisible(false);
      }

      // Naya layer map pe add karo
      mapInstanceRef.current.addLayer(newTileLayer);

      // Ref update karo
      wmsLayersRef.current[layerKey] = newTileLayer;
    }
  };

  // Format length measurement
  const formatLength = (length, unit) => {
    let output;
    switch (unit) {
      case "meters":
        output =
          length > 1000
            ? `${(length / 1000).toFixed(2)} km`
            : `${length.toFixed(2)} m`;
        break;
      case "kilometers":
        output = `${(length / 1000).toFixed(2)} km`;
        break;
      case "feet":
        output = `${(length * 3.28084).toFixed(2)} ft`;
        break;
      case "miles":
        output = `${(length / 1609.344).toFixed(2)} mi`;
        break;
      default:
        output = `${length.toFixed(2)} m`;
    }
    return output;
  };

  // Format area measurement
  const formatArea = (area, unit) => {
    let output;
    switch (unit) {
      case "sqmeters":
        output =
          area > 10000
            ? `${(area / 1000000).toFixed(2)} km²`
            : `${area.toFixed(2)} m²`;
        break;
      case "sqkilometers":
        output = `${(area / 1000000).toFixed(2)} km²`;
        break;
      case "hectares":
        output = `${(area / 10000).toFixed(2)} ha`;
        break;
      case "acres":
        output = `${(area / 4046.86).toFixed(2)} ac`;
        break;
      default:
        output = `${area.toFixed(2)} m²`;
    }
    return output;
  };

  // Start measurement
  const startMeasurement = () => {
    if (!mapInstanceRef.current) return;

    setIsMeasuring(true);
    const map = mapInstanceRef.current;

    // Create measure layer if not exists
    if (!measureLayerRef.current) {
      const source = new VectorSource();
      const vector = new VectorLayer({
        source: source,
        style: new Style({
          fill: new Fill({
            color: "rgba(255, 165, 0, 0.2)",
          }),
          stroke: new Stroke({
            color: "#ff6600",
            width: 3,
          }),
        }),
        zIndex: 1000,
      });
      measureLayerRef.current = vector;
      map.addLayer(vector);
    }

    // Create draw interaction
    const draw = new Draw({
      source: measureLayerRef.current.getSource(),
      type: measureType,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 165, 0, 0.2)",
        }),
        stroke: new Stroke({
          color: "#ff6600",
          lineDash: [10, 10],
          width: 3,
        }),
      }),
    });

    drawInteractionRef.current = draw;
    map.addInteraction(draw);

    // Create tooltip overlay for live measurement
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "ol-tooltip ol-tooltip-measure";
    tooltipElement.style.cssText = `
    position: absolute;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
    white-space: nowrap;
  `;

    const measureTooltip = new Overlay({
      element: tooltipElement,
      offset: [0, -15],
      positioning: "bottom-center",
    });
    map.addOverlay(measureTooltip);
    measureOverlayRef.current = measureTooltip;

    let sketch;

    draw.on("drawstart", (evt) => {
      sketch = evt.feature;

      sketch.getGeometry().on("change", (e) => {
        const geom = e.target;
        let output;

        const geomType = geom.getType();

        if (geomType === "Polygon") {
          output = formatArea(getArea(geom), measureAreaUnit);
        } else if (geomType === "LineString") {
          output = formatLength(getLength(geom), measureUnit);
        }

        tooltipElement.innerHTML = output;
        measureTooltip.setPosition(geom.getLastCoordinate());
      });
    });

    draw.on("drawend", (evt) => {
      const geometry = evt.feature.getGeometry();
      let value, type;

      if (geometry.getType() === "Polygon") {
        value = formatArea(getArea(geometry), measureAreaUnit);
        type = "Polygon";
      } else {
        value = formatLength(getLength(geometry), measureUnit);
        type = "LineString";
      }

      // Save measurement
      setMeasurements((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: type,
          value: value,
          unit: type === "LineString" ? measureUnit : measureAreaUnit,
          olFeature: evt.feature, // ← ADD KARO
        },
      ]);

      // Remove draw interaction
      map.removeInteraction(draw);
      map.removeOverlay(measureTooltip);
      setIsMeasuring(false);
      drawInteractionRef.current = null;
    });
  };

  // Stop measurement
  const stopMeasurement = () => {
    if (!mapInstanceRef.current || !drawInteractionRef.current) return;

    mapInstanceRef.current.removeInteraction(drawInteractionRef.current);
    if (measureOverlayRef.current) {
      mapInstanceRef.current.removeOverlay(measureOverlayRef.current);
    }
    setIsMeasuring(false);
    drawInteractionRef.current = null;
  };
  // Point in polygon check (ray casting algorithm)
  const isPointInPolygon = (lon, lat, ring) => {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const xi = ring[i][0],
        yi = ring[i][1];
      const xj = ring[j][0],
        yj = ring[j][1];
      if (
        yi > lat !== yj > lat &&
        lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check karo feature buffer ke andar hai ya nahi - ALL geometry types handle
  const isFeatureInRadius = (feature, centerLon, centerLat, radiusMeters) => {
    const geom = feature.geometry;
    if (!geom) return false;

    const { latDelta, lonDelta } = metersToDegrees(radiusMeters, centerLat);

    // Point distance check
    const inRadius = (coord) =>
      getDistanceMeters(centerLon, centerLat, coord[0], coord[1]) <=
      radiusMeters;

    // Line segment se minimum distance check karo
    const segmentInRadius = (coords) => {
      for (let i = 0; i < coords.length - 1; i++) {
        const [x1, y1] = coords[i];
        const [x2, y2] = coords[i + 1];
        // Segment pe nearest point dhundo
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lenSq = dx * dx + dy * dy;
        let t = 0;
        if (lenSq > 0) {
          t = ((centerLon - x1) * dx + (centerLat - y1) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
        }
        const nearestLon = x1 + t * dx;
        const nearestLat = y1 + t * dy;
        if (
          getDistanceMeters(centerLon, centerLat, nearestLon, nearestLat) <=
          radiusMeters
        ) {
          return true;
        }
      }
      return false;
    };

    switch (geom.type) {
      case "Point":
        return inRadius(geom.coordinates);

      case "MultiPoint":
        return geom.coordinates.some(inRadius);

      case "LineString":
        return segmentInRadius(geom.coordinates);

      case "MultiLineString":
        return geom.coordinates.some(segmentInRadius);

      case "Polygon": {
        const ring = geom.coordinates[0];
        // Buffer center polygon ke andar hai
        if (isPointInPolygon(centerLon, centerLat, ring)) return true;
        // Polygon boundary buffer ko touch karti hai
        return segmentInRadius(ring);
      }

      case "MultiPolygon":
        return geom.coordinates.some((polygon) => {
          const ring = polygon[0];
          if (isPointInPolygon(centerLon, centerLat, ring)) return true;
          return segmentInRadius(ring);
        });

      default:
        return true;
    }
  };
  // Clear all measurements
  const clearMeasurements = () => {
    if (measureLayerRef.current) {
      measureLayerRef.current.getSource().clear();
    }
    setMeasurements([]);
    stopMeasurement();
  };

  // Asset search

  const metersToDegrees = (meters, lat) => {
    const latDelta = meters / 111320;
    const lonDelta = meters / (111320 * Math.cos((lat * Math.PI) / 180));
    return { latDelta, lonDelta };
  };

  const getDistanceMeters = (lon1, lat1, lon2, lat2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const drawBuffer = (lon, lat, radiusMeters) => {
    if (!assetBufferLayerRef.current) return;
    const source = assetBufferLayerRef.current.getSource();
    source.clear();
    const points = 64;
    const coords = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const { latDelta, lonDelta } = metersToDegrees(radiusMeters, lat);
      const pLon = lon + lonDelta * Math.cos(angle);
      const pLat = lat + latDelta * Math.sin(angle);
      coords.push(fromLonLat([pLon, pLat]));
    }
    coords.push(coords[0]);
    const circleFeature = new Feature({ geometry: new Polygon([coords]) });
    source.addFeature(circleFeature);
  };

  const performAssetSearch = async () => {
    if (!incidentPoint) {
      alert("Pehle map pe point select karo");
      return;
    }
    const radiusMeters =
      searchUnit === "kilometers" ? searchRange * 1000 : searchRange;
    drawBuffer(incidentPoint.lon, incidentPoint.lat, radiusMeters);
    setAssetSearchLoading(true);
    setAssetResults({});
    const { lon, lat } = incidentPoint;
    const { latDelta, lonDelta } = metersToDegrees(radiusMeters, lat);
    // Buffer se 2x bada bbox - large polygons bhi aa jayenge
    const bbox = `${lon - lonDelta * 2},${lat - latDelta * 2},${lon + lonDelta * 2},${lat + latDelta * 2},EPSG:4326`;
    const results = {};
    const layersToSearch = [];
    Object.entries(layerGroups).forEach(([groupKey, group]) => {
      Object.entries(group.children).forEach(([layerKey, layer]) => {
        if (!layer.children && layer.wmsLayer) {
          if (assetLayerFilter === "All" || assetLayerFilter === layerKey) {
            layersToSearch.push({ layerKey, layer });
          }
        }
      });
    });
    for (const { layerKey, layer } of layersToSearch) {
      try {
        const params = new URLSearchParams({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: layer.wmsLayer,
          outputFormat: "application/json",
          srsName: "EPSG:4326",
          bbox,
        });
        const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
        const data = await res.json();
        if (data.features && data.features.length > 0) {
          const filtered = data.features.filter((f) => {
            if (!f.geometry) return false;
            return isFeatureInRadius(f, lon, lat, radiusMeters);
          });
          if (filtered.length > 0) {
            results[layerKey] = { layerName: layer.name, features: filtered };
          }
        }
      } catch (e) {
        console.error(`Error fetching ${layerKey}:`, e);
      }
    }
    setAssetResults(results);
    const expanded = {};
    Object.keys(results).forEach((k) => (expanded[k] = false));
    setAssetResultsExpanded(expanded);
    setAssetSearchLoading(false);
  };

  const zoomToAssetFeature = (feature) => {
    if (!feature.geometry || !mapInstanceRef.current) return;
    const geojsonFormat = new GeoJSON();
    try {
      const olFeature = geojsonFormat.readFeature(feature, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
      const geom = olFeature.getGeometry();
      const view = mapInstanceRef.current.getView();
      if (
        feature.geometry.type === "Point" ||
        feature.geometry.type === "MultiPoint"
      ) {
        const assetExtent = geom.getExtent();
        if (assetExtent && assetExtent.every((v) => isFinite(v))) {
          const [minX, minY, maxX, maxY] = assetExtent;
          if (maxX - minX < 1 && maxY - minY < 1) {
            view.animate({
              center: [(minX + maxX) / 2, (minY + maxY) / 2],
              zoom: 15,
              duration: 800,
            });
          } else {
            view.fit(assetExtent, {
              padding: [100, 100, 100, 100],
              duration: 800,
            });
          }
        }
      } else {
        view.fit(geom.getExtent(), {
          padding: [80, 80, 80, 80],
          duration: 800,
          maxZoom: 18,
        });
      }
      if (selectionLayerRef.current) {
        selectionLayerRef.current.getSource().clear();
        selectionLayerRef.current.getSource().addFeature(olFeature);
      }
    } catch (e) {
      console.error(e);
    }
  };
  const fetchFeaturesInBbox = async (extent4326) => {
    if (!queryLayer) return;
    const wmsLayerName = layerExtentsRef.current[queryLayer];
    if (!wmsLayerName) return;

    const bbox = `${extent4326[0]},${extent4326[1]},${extent4326[2]},${extent4326[3]},EPSG:4326`;
    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        bbox,
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();
      handleSelectResults(data, wmsLayerName);
    } catch (e) {
      console.error("BBox select error:", e);
    }
  };

  const fetchFeaturesInGeometry = async (polygon4326) => {
    if (!queryLayer) return;
    const wmsLayerName = layerExtentsRef.current[queryLayer];
    if (!wmsLayerName) return;

    const coords = polygon4326
      .getCoordinates()[0]
      .map((c) => c.join(" "))
      .join(",");
    const cqlFilter = `INTERSECTS(the_geom, POLYGON((${coords})))`;

    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
        CQL_FILTER: cqlFilter,
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const data = await res.json();
      handleSelectResults(data, wmsLayerName);
    } catch (e) {
      // Fallback: bbox use karo
      const extent = polygon4326.getExtent();
      fetchFeaturesInBbox(extent);
    }
  };

  const handleSelectResults = async (data, wmsLayerName) => {
    if (!data.features || data.features.length === 0) {
      alert("No features selected");
      return;
    }

    const cols = Object.keys(data.features[0].properties).map((key) => ({
      id: key,
      label: key.toUpperCase().replace(/_/g, " "),
    }));
    setAttributeColumns(cols);

    // Puri layer ka data fetch karo
    try {
      const params = new URLSearchParams({
        ...DEFAULT_WFS_PARAMS,
        typeName: wmsLayerName,
      });
      const res = await fetch(`${GEOSERVER_CONFIG.wfsUrl}?${params}`);
      const allData = await res.json();

      if (allData.features?.length > 0) {
        const allRows = allData.features.map((f, i) => ({
          id: i,
          ...f.properties,
        }));
        attributeFeaturesRef.current = allData.features;
        setAttributeData(allRows);
        setAttributeLayerName(wmsLayerName);

        // Selected features ko match karo
        const idKey = cols[0]?.id;
        const selectedProps = data.features.map((f) => f.properties[idKey]);
        const selectedIds = allRows
          .filter((row) => selectedProps.includes(row[idKey]))
          .map((r) => r.id);

        setSelectedRows(selectedIds);
        updateMapSelectionFromRows(selectedIds);
      }
    } catch (e) {
      console.error("Fetch all data error:", e);
    }

    setTablePage(0);
  };

  const clearAssetSearch = () => {
    setIncidentPoint(null);
    setAssetResults({});
    setAssetResultsExpanded({});
    setAssetSearchMode("idle");
    isAssetSelectingRef.current = false;
    if (assetBufferLayerRef.current)
      assetBufferLayerRef.current.getSource().clear();
    if (assetPointLayerRef.current)
      assetPointLayerRef.current.getSource().clear();
    if (selectionLayerRef.current) {
      selectionLayerRef.current.getSource().clear();
      selectionLayerRef.current.changed();
    }
  };
  // Asset searh end

  // Convert decimal degrees to DMS format
  const convertToDMS = (decimal, isLat) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesDecimal = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesDecimal);
    const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);

    const direction = isLat
      ? decimal >= 0
        ? "N"
        : "S"
      : decimal >= 0
        ? "E"
        : "W";

    return `${degrees}°${minutes}'${seconds}"${direction}`;
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
          {/* ADD BACK BUTTON - END */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 2, flexGrow: 1 }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", color: "#f6f9f6ff" }}
            >
              BlueView
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
                  onNavigateToDashboard();
                }}
              >
                Dashboard
              </MenuItem>
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
            sx={{ display: "flex", flexDirection: "column", height: "100%" }}
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
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  flex: 1,
                  minHeight: "40px",
                  "& .MuiTab-root": {
                    minHeight: "40px",
                    textTransform: "none",
                    fontSize: "13px",
                  },
                  "& .MuiTabScrollButton-root": {
                    width: 20,
                    color: "#1976d2",
                  },
                }}
              >
                <Tab label="Layers" />
                <Tab label="Legend" />
                {activeTools.includes("draw") && <Tab label="Draw" />}
                {activeTools.includes("print") && <Tab label="Print" />}
                {activeTools.includes("measure") && <Tab label="Measure" />}
                {activeTools.includes("filter") && <Tab label="Filter" />}
                {activeTools.includes("assetSearch") && (
                  <Tab label="Asset Search" />
                )}
                {activeTools.includes("query") && <Tab label="Query" />}{" "}
                {activeTools.includes("select") && <Tab label="Select" />}
                {activeTools.includes("bookmark") && <Tab label="Bookmark" />}
                {/* YE ADD KARO */}
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
                sx={{ flex: 1, textTransform: "none", fontSize: "11px" }}
              >
                Upload
              </Button>
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudDownloadIcon />}
                sx={{ flex: 1, textTransform: "none", fontSize: "11px" }}
              >
                Export
              </Button>
            </Box>

            {/* <Box sx={{ p: 1, borderBottom: "1px solid #e0e0e0" }}>
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
            </Box> */}

            <Box
              sx={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {activeTab === 0 ? (
                // LAYERS TAB
                <List dense>
                  {Object.entries(layerGroups).map(([groupKey, group]) => (
                    <Box key={groupKey}>
                      <ListItemButton
                        onClick={() => toggleGroupExpanded(groupKey)}
                      >
                        <Checkbox
                          size="small"
                          checked={group.visible}
                          onChange={() => toggleGroupVisibility(groupKey)}
                          onClick={(e) => e.stopPropagation()}
                          sx={{ p: 0, mr: 1 }}
                        />
                        <LayersIcon
                          sx={{ mr: 1, fontSize: 20, color: "#1976d2" }}
                        />
                        <ListItemText
                          primary={group.name}
                          primaryTypographyProps={{
                            fontSize: "14px",
                            fontWeight: 500,
                          }}
                        />
                        {group.expanded ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>

                      <Collapse
                        in={group.expanded}
                        timeout="auto"
                        unmountOnExit
                      >
                        <List component="div" disablePadding>
                          {Object.entries(group.children).map(
                            ([layerKey, layer]) => (
                              <Box key={layerKey}>
                                {layer.children ? (
                                  <>
                                    <ListItemButton
                                      onClick={() =>
                                        toggleNestedExpanded(groupKey, layerKey)
                                      }
                                      sx={{ pl: 4 }}
                                    >
                                      <Checkbox
                                        size="small"
                                        checked={layer.visible}
                                        onChange={() =>
                                          toggleLayerVisibility(
                                            groupKey,
                                            layerKey,
                                          )
                                        }
                                        onClick={(e) => e.stopPropagation()}
                                        sx={{ p: 0, mr: 1 }}
                                      />
                                      <ListItemText
                                        primary={layer.name}
                                        primaryTypographyProps={{
                                          fontSize: "13px",
                                          fontWeight: 500,
                                        }}
                                      />
                                      {layer.expanded ? (
                                        <ExpandLess />
                                      ) : (
                                        <ExpandMore />
                                      )}
                                    </ListItemButton>

                                    <Collapse
                                      in={layer.expanded}
                                      timeout="auto"
                                      unmountOnExit
                                    >
                                      <List component="div" disablePadding>
                                        {Object.entries(layer.children).map(
                                          ([nestedKey, nestedLayer]) => (
                                            <ListItem
                                              key={nestedKey}
                                              sx={{
                                                pl: 8,
                                                display: "flex",
                                                alignItems: "center",
                                              }}
                                            >
                                              <Checkbox
                                                size="small"
                                                checked={nestedLayer.visible}
                                                onChange={() =>
                                                  toggleLayerVisibility(
                                                    groupKey,
                                                    layerKey,
                                                    nestedKey,
                                                  )
                                                }
                                                sx={{ p: 0, mr: 1 }}
                                              />
                                              <ListItemText
                                                primary={nestedLayer.name}
                                                secondary={
                                                  nestedLayer.visible
                                                    ? "Visible"
                                                    : "Hidden"
                                                }
                                                primaryTypographyProps={{
                                                  fontSize: "12px",
                                                }}
                                                secondaryTypographyProps={{
                                                  fontSize: "10px",
                                                }}
                                              />
                                              <IconButton
                                                size="small"
                                                onClick={(e) =>
                                                  handleLayerMenuClick(
                                                    e,
                                                    groupKey,
                                                    layerKey,
                                                    nestedKey,
                                                  )
                                                }
                                                sx={{
                                                  ml: "auto",
                                                  color: "rgba(0,0,0,0.54)",
                                                  "&:hover": {
                                                    bgcolor: "#e3f2fd",
                                                    color: "#0d47a1",
                                                  },
                                                }}
                                              >
                                                <MoreVertIcon fontSize="small" />
                                              </IconButton>
                                            </ListItem>
                                          ),
                                        )}
                                      </List>
                                    </Collapse>
                                  </>
                                ) : (
                                  <ListItem
                                    sx={{
                                      pl: 6,
                                      display: "flex",
                                      alignItems: "center",
                                      bgcolor:
                                        selectedQueryLayer === layerKey
                                          ? "rgba(25, 118, 210, 0.12)"
                                          : "transparent",
                                      borderLeft:
                                        selectedQueryLayer === layerKey
                                          ? "3px solid #1976d2"
                                          : "3px solid transparent",
                                      transition: "all 0.2s",
                                    }}
                                  >
                                    <Checkbox
                                      size="small"
                                      checked={layer.visible}
                                      onChange={() =>
                                        toggleLayerVisibility(
                                          groupKey,
                                          layerKey,
                                        )
                                      }
                                      sx={{ p: 0, mr: 1 }}
                                    />
                                    <ListItemText
                                      primary={layer.name}
                                      primaryTypographyProps={{
                                        fontSize: "13px",
                                      }}
                                      secondaryTypographyProps={{
                                        fontSize: "11px",
                                      }}
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={(e) =>
                                        handleLayerMenuClick(
                                          e,
                                          groupKey,
                                          layerKey,
                                        )
                                      }
                                      sx={{
                                        ml: "auto",
                                        "&:hover": {
                                          bgcolor: "#e3f2fd",
                                          color: "#1976d2",
                                        },
                                      }}
                                    >
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </ListItem>
                                )}
                              </Box>
                            ),
                          )}
                        </List>
                      </Collapse>

                      <Divider />
                    </Box>
                  ))}
                </List>
              ) : activeTab === 1 ? (
                // LEGEND TAB
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Map Legend
                  </Typography>

                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    {Object.entries(layerGroups).map(([groupKey, group]) => {
                      return Object.entries(group.children).map(
                        ([layerKey, layer]) => {
                          if (!layer.visible) return null;

                          if (layer.children) {
                            return Object.entries(layer.children).map(
                              ([nestedKey, nestedLayer]) => {
                                if (!nestedLayer.visible) return null;

                                return (
                                  <Box key={nestedKey}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: "12px",
                                        fontWeight: 500,
                                        mb: 0.5,
                                      }}
                                    >
                                      {nestedLayer.name}
                                    </Typography>
                                    <img
                                      src={`${nestedLayer.wmsUrl || "https://gis.mapgeoid.com/geoserver/wms"}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${nestedLayer.wmsLayer}`}
                                      alt={nestedLayer.name}
                                      style={{
                                        display: "block",
                                        maxWidth: "100px",
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  </Box>
                                );
                              },
                            );
                          } else {
                            return (
                              <Box key={layerKey}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    mb: 0.5,
                                  }}
                                >
                                  {layer.name}
                                </Typography>
                                <img
                                  src={`${layer.wmsUrl || "https://gis.mapgeoid.com/geoserver/wms"}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer.wmsLayer}`}
                                  alt={layer.name}
                                  style={{
                                    display: "block",
                                    maxWidth: "100px",
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              </Box>
                            );
                          }
                        },
                      );
                    })}
                  </Box>

                  {Object.entries(layerGroups).every(([groupKey, group]) =>
                    Object.entries(group.children).every(
                      ([layerKey, layer]) => !layer.visible,
                    ),
                  ) && (
                    <Box sx={{ textAlign: "center", py: 4, color: "#999" }}>
                      <LayersIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                      <Typography variant="body2">
                        No visible layers to show in legend
                      </Typography>
                    </Box>
                  )}
                </Box>
              ) : activeTools.includes("draw") &&
                activeTab ===
                  2 +
                    ["draw", "print", "measure"]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("draw") ? (
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Drawing Tools
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Draw Type
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={drawType}
                      onChange={(e) => setDrawType(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="Point">Point</MenuItem>
                      <MenuItem value="LineString">Line</MenuItem>
                      <MenuItem value="Polygon">Polygon</MenuItem>
                      <MenuItem value="Circle">Circle</MenuItem>
                    </Select>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* <Box
                    sx={{ mb: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "11px", color: "#1976d2" }}
                    >
                      {drawType === "Point" && "📍 Click on map to add a point"}
                      {drawType === "LineString" &&
                        "📏 Click multiple points to draw a line"}
                      {drawType === "Polygon" &&
                        "📐 Click multiple points to draw a polygon"}
                      {drawType === "Circle" &&
                        "⭕ Click and drag to draw a circle"}
                    </Typography>
                  </Box> */}

                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      mb: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 500, flexShrink: 0 }}
                    >
                      Drawn Features ({drawnFeatures.length})
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                      {drawnFeatures.length === 0 ? (
                        <Typography
                          variant="caption"
                          sx={{ color: "#999", fontSize: "11px" }}
                        >
                          No features drawn yet
                        </Typography>
                      ) : (
                        drawnFeatures.map((feature, index) => (
                          <Paper
                            key={index}
                            sx={{
                              p: 1,
                              mb: 1,
                              bgcolor: "#f5f5f5",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600, fontSize: "11px" }}
                              >
                                {feature.type}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: "12px", color: "#1976d2" }}
                              >
                                Feature #{index + 1}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (
                                    !feature.olFeature ||
                                    !mapInstanceRef.current
                                  )
                                    return;
                                  const geom = feature.olFeature.getGeometry();
                                  if (!geom) return;
                                  const view = mapInstanceRef.current.getView();
                                  const geomType = geom.getType();
                                  const extent = geom.getExtent();
                                  if (
                                    extent &&
                                    extent.every((v) => isFinite(v))
                                  ) {
                                    const [minX, minY, maxX, maxY] = extent;
                                    if (maxX - minX < 1 && maxY - minY < 1) {
                                      view.animate({
                                        center: [
                                          (minX + maxX) / 2,
                                          (minY + maxY) / 2,
                                        ],
                                        zoom: 15,
                                        duration: 800,
                                      });
                                    } else {
                                      view.fit(extent, {
                                        padding: [100, 100, 100, 100],
                                        duration: 800,
                                      });
                                    }
                                  }
                                }}
                                sx={{
                                  color: "#1976d2",
                                  "&:hover": { bgcolor: "#e3f2fd" },
                                }}
                                title="Zoom to feature"
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  const feature = drawnFeatures[index];
                                  if (
                                    feature.olFeature &&
                                    drawLayerRef.current
                                  ) {
                                    drawLayerRef.current
                                      .getSource()
                                      .removeFeature(feature.olFeature);
                                  }
                                  setDrawnFeatures(
                                    drawnFeatures.filter((_, i) => i !== index),
                                  );
                                }}
                                sx={{ color: "#f44336" }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      flexShrink: 0,
                      mb: 2,
                    }}
                  >
                    {!isDrawingActive ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => {
                          if (!mapInstanceRef.current || !drawLayerRef.current)
                            return;

                          // Pehle se active draw hatao
                          if (drawInteractionRef.current) {
                            mapInstanceRef.current.removeInteraction(
                              drawInteractionRef.current,
                            );
                          }

                          const draw = new Draw({
                            source: drawLayerRef.current.getSource(),
                            type: drawType,
                          });

                          drawInteractionRef.current = draw;
                          isDrawingActiveRef.current = true; // ← SET
                          setIsDrawingActive(true); // ← UI update
                          mapInstanceRef.current.addInteraction(draw);

                          draw.on("drawend", (evt) => {
                            const geomType = evt.feature
                              .getGeometry()
                              .getType();
                            setDrawnFeatures((prev) => [
                              ...prev,
                              {
                                type: geomType,
                                id: Date.now(),
                                olFeature: evt.feature,
                              },
                            ]);

                            // Point ke baad auto-stop, Line/Polygon continuous mode
                            if (drawType === "Point") {
                              mapInstanceRef.current.removeInteraction(draw);
                              drawInteractionRef.current = null;
                              isDrawingActiveRef.current = false; // ← RESET
                              setIsDrawingActive(false);
                            }
                          });
                        }}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#115293" },
                        }}
                      >
                        Start Drawing
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          if (
                            drawInteractionRef.current &&
                            mapInstanceRef.current
                          ) {
                            mapInstanceRef.current.removeInteraction(
                              drawInteractionRef.current,
                            );
                            drawInteractionRef.current = null;
                          }
                          isDrawingActiveRef.current = false; // ← RESET
                          setIsDrawingActive(false);
                        }}
                        sx={{
                          bgcolor: "#ff9800",
                          "&:hover": { bgcolor: "#f57c00" },
                        }}
                      >
                        Stop Drawing
                      </Button>
                    )}

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setDrawnFeatures([]);
                          if (drawLayerRef.current) {
                            drawLayerRef.current.getSource().clear();
                          }
                          if (
                            drawInteractionRef.current &&
                            mapInstanceRef.current
                          ) {
                            mapInstanceRef.current.removeInteraction(
                              drawInteractionRef.current,
                            );
                            drawInteractionRef.current = null;
                          }
                        }}
                        sx={{ borderColor: "#ff9800", color: "#ff9800" }}
                      >
                        Clear All
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          setActiveTools(
                            activeTools.filter((t) => t !== "draw"),
                          );
                          setActiveTab(0);
                        }}
                        sx={{ borderColor: "#f44336", color: "#f44336" }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : // PRINT TAB - YE PURA SECTION DHUNDO AUR REPLACE KARO
              // Dhundo: activeTools.includes("print") wala pura ternary block
              // Start: ) : activeTools.includes("print") &&
              // End: ) : activeTools.includes("measure") && (yahan tak replace karo)

              // ============ REPLACE WITH THIS ============

              activeTools.includes("print") &&
                activeTab ===
                  2 +
                    ["draw", "print", "measure"]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("print") ? (
                // PRINT TAB
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Print Map
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Print Template
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={printTemplate}
                      onChange={(e) => setPrintTemplate(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="landscape">Landscape</MenuItem>
                      <MenuItem value="portrait">Portrait</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Page Size
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={printPage}
                      onChange={(e) => setPrintPage(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="A4">A4 (210 x 297 mm)</MenuItem>
                      <MenuItem value="A3">A3 (297 x 420 mm)</MenuItem>
                      <MenuItem value="A2">A2 (420 x 594 mm)</MenuItem>
                      <MenuItem value="A1">A1 (594 x 841 mm)</MenuItem>
                      <MenuItem value="A0">A0 (841 x 1189 mm)</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Output Format
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={printFormat}
                      onChange={(e) => setPrintFormat(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="PNG">PNG Image</MenuItem>
                      <MenuItem value="JPEG">JPEG Image</MenuItem>
                      <MenuItem value="PDF">PDF Document</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Title
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter map title"
                      value={printTitle}
                      onChange={(e) => setPrintTitle(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Created By
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter your name"
                      value={printCreatedBy}
                      onChange={(e) => setPrintCreatedBy(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "row",
                      gap: 1,
                      mt: "auto",
                      flexShrink: 0,
                      mb: 2,
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PrintIcon />}
                      onClick={handlePrintPreview}
                      disabled={printGenerating}
                      sx={{
                        bgcolor: "#1976d2",
                        "&:hover": { bgcolor: "#115293" },
                      }}
                    >
                      {printGenerating ? "Generating..." : "Print Preview"}
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={() => {
                        setActiveTools(
                          activeTools.filter((t) => t !== "print"),
                        );
                        setActiveTab(0);
                      }}
                      sx={{ borderColor: "#f44336", color: "#f44336" }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              ) : activeTools.includes("measure") &&
                activeTab ===
                  2 +
                    ["draw", "print", "measure"]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("measure") ? (
                // MEASURE TAB
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "calc(100vh - 160px)",
                    // overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Measurement Tools
                  </Typography>

                  {/* Measurement Type */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Measurement Type
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={measureType}
                      onChange={(e) => {
                        setMeasureType(e.target.value);
                        if (isMeasuring) stopMeasurement();
                      }}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="LineString">📏 Distance</MenuItem>
                      <MenuItem value="Polygon">📐 Area</MenuItem>
                    </Select>
                  </Box>

                  {/* Unit Selector */}
                  {measureType === "LineString" ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5, fontWeight: 500 }}
                      >
                        Distance Unit
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={measureUnit}
                        onChange={(e) => setMeasureUnit(e.target.value)}
                        sx={{ bgcolor: "white" }}
                      >
                        <MenuItem value="meters">Meters (m)</MenuItem>
                        <MenuItem value="kilometers">Kilometers (km)</MenuItem>
                        <MenuItem value="feet">Feet (ft)</MenuItem>
                        <MenuItem value="miles">Miles (mi)</MenuItem>
                      </Select>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 2 }}>
                      <Typography
                        variant="body2"
                        sx={{ mb: 0.5, fontWeight: 500 }}
                      >
                        Area Unit
                      </Typography>
                      <Select
                        fullWidth
                        size="small"
                        value={measureAreaUnit}
                        onChange={(e) => setMeasureAreaUnit(e.target.value)}
                        sx={{ bgcolor: "white" }}
                      >
                        <MenuItem value="sqmeters">Square Meters (m²)</MenuItem>
                        <MenuItem value="sqkilometers">
                          Square Kilometers (km²)
                        </MenuItem>
                        <MenuItem value="hectares">Hectares (ha)</MenuItem>
                        <MenuItem value="acres">Acres (ac)</MenuItem>
                      </Select>
                    </Box>
                  )}

                  {/* <Divider sx={{ my: 2 }} /> */}

                  {/* Instructions */}
                  {/* <Box
                    sx={{ mb: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: "11px",
                        color: "#1976d2",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {measureType === "LineString"
                        ? "📏 Click points on map to measure distance"
                        : "📐 Click points on map to measure area"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "10px", color: "#666" }}
                    >
                      Double-click to finish measurement
                    </Typography>
                  </Box> */}

                  {/* Measurements List */}
                  {/* Measurements List */}
                  <Box
                    sx={{
                      flex: 1,
                      minHeight: 0,
                      mb: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mb: 1, fontWeight: 500, flexShrink: 0 }}
                    >
                      Measurements ({measurements.length})
                    </Typography>
                    <Box sx={{ flex: 1, minHeight: 0, overflow: "auto" }}>
                      {measurements.length === 0 ? (
                        <Typography
                          variant="caption"
                          sx={{ color: "#999", fontSize: "11px" }}
                        >
                          No measurements yet
                        </Typography>
                      ) : (
                        measurements.map((measurement, index) => (
                          <Paper
                            key={measurement.id}
                            sx={{
                              p: 1,
                              mb: 1,
                              bgcolor: "#f5f5f5",
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Box>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600, fontSize: "11px" }}
                              >
                                {measurement.type === "LineString"
                                  ? "📏 Distance"
                                  : "📐 Area"}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontSize: "13px",
                                  color: "#1976d2",
                                  fontWeight: 600,
                                }}
                              >
                                {measurement.value}
                              </Typography>
                            </Box>
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (
                                    !measurement.olFeature ||
                                    !mapInstanceRef.current
                                  )
                                    return;
                                  const geom =
                                    measurement.olFeature.getGeometry();
                                  if (!geom) return;
                                  const view = mapInstanceRef.current.getView();
                                  const geomType = geom.getType();
                                  const extent = geom.getExtent();
                                  if (
                                    extent &&
                                    extent.every((v) => isFinite(v))
                                  ) {
                                    const [minX, minY, maxX, maxY] = extent;
                                    if (maxX - minX < 1 && maxY - minY < 1) {
                                      view.animate({
                                        center: [
                                          (minX + maxX) / 2,
                                          (minY + maxY) / 2,
                                        ],
                                        zoom: 15,
                                        duration: 800,
                                      });
                                    } else {
                                      view.fit(extent, {
                                        padding: [100, 100, 100, 100],
                                        duration: 800,
                                      });
                                    }
                                  }
                                }}
                                sx={{
                                  color: "#1976d2",
                                  "&:hover": { bgcolor: "#e3f2fd" },
                                }}
                                title="Zoom to measurement"
                              >
                                <SearchIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (
                                    measurement.olFeature &&
                                    measureLayerRef.current
                                  ) {
                                    measureLayerRef.current
                                      .getSource()
                                      .removeFeature(measurement.olFeature);
                                  }
                                  setMeasurements(
                                    measurements.filter(
                                      (m) => m.id !== measurement.id,
                                    ),
                                  );
                                }}
                                sx={{ color: "#f44336" }}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Paper>
                        ))
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  {/* Action Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      flexShrink: 0,
                      mb: 2,
                    }}
                  >
                    {!isMeasuring ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<MapIcon />}
                        onClick={startMeasurement}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#115293" },
                        }}
                      >
                        Start Measuring
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={stopMeasurement}
                        sx={{
                          bgcolor: "#ff9800",
                          "&:hover": { bgcolor: "#f57c00" },
                        }}
                      >
                        Stop Measuring
                      </Button>
                    )}

                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={clearMeasurements}
                        disabled={measurements.length === 0}
                        sx={{ borderColor: "#ff9800", color: "#ff9800" }}
                      >
                        Clear All
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          stopMeasurement();
                          setActiveTools(
                            activeTools.filter((t) => t !== "measure"),
                          );
                          setActiveTab(0);
                        }}
                        sx={{ borderColor: "#f44336", color: "#f44336" }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : activeTools.includes("filter") &&
                activeTab ===
                  2 +
                    ["draw", "print", "measure", "filter"]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("filter") ? (
                // FILTER TAB
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Filter Features
                  </Typography>

                  {/* Select Layer */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Select Layer
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={filterLayer}
                      onChange={(e) => {
                        setFilterLayer(e.target.value);
                        // Filter ke liye alag fields fetch karo
                        const layerKey = e.target.value;
                        const wmsLayerName = layerExtentsRef.current[layerKey];
                        if (!wmsLayerName) return;
                        fetch(
                          `${GEOSERVER_CONFIG.wfsUrl}?${new URLSearchParams({
                            ...DEFAULT_WFS_PARAMS,
                            typeName: wmsLayerName,
                            maxFeatures: 1,
                          })}`,
                        )
                          .then((r) => r.json())
                          .then((data) => {
                            if (data.features?.length > 0) {
                              setFilterLayerFields(
                                Object.keys(data.features[0].properties),
                              );
                            }
                          })
                          .catch(console.error);
                      }}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="">-- Select Layer --</MenuItem>
                      {Object.entries(layerGroups).map(([groupKey, group]) =>
                        Object.entries(group.children).map(
                          ([layerKey, layer]) => (
                            <MenuItem key={layerKey} value={layerKey}>
                              {layer.name}
                            </MenuItem>
                          ),
                        ),
                      )}
                    </Select>
                  </Box>

                  {/* Expression Builder */}
                  <Box
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      overflow: "visible",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        bgcolor: "#f0f4fa",
                        borderBottom: "1px solid #ccc",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: 12 }}
                      >
                        Expression
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1 }}>
                      {filterClauses.map((clause, idx) => (
                        <Box
                          key={clause.id}
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            mb: 0.8,
                            flexWrap: "nowrap",
                          }}
                        >
                          {idx === 0 ? (
                            <Typography
                              variant="caption"
                              sx={{
                                width: 46,
                                fontSize: 12,
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              Where
                            </Typography>
                          ) : (
                            <Select
                              size="small"
                              value={clause.conjunction || "And"}
                              onChange={(e) => {
                                const u = [...filterClauses];
                                u[idx].conjunction = e.target.value;
                                setFilterClauses(u);
                              }}
                              sx={{ width: 60, fontSize: 11 }}
                            >
                              <MenuItem value="And" sx={{ fontSize: 11 }}>
                                And
                              </MenuItem>
                              <MenuItem value="Or" sx={{ fontSize: 11 }}>
                                Or
                              </MenuItem>
                            </Select>
                          )}

                          {/* Field */}
                          <Select
                            size="small"
                            value={clause.field}
                            onChange={(e) => {
                              const u = [...filterClauses];
                              u[idx].field = e.target.value;
                              setFilterClauses(u);
                            }}
                            sx={{ flex: 1, fontSize: 11, minWidth: 0 }}
                            displayEmpty
                          >
                            <MenuItem
                              value=""
                              sx={{ fontSize: 11, color: "#aaa" }}
                            >
                              Field
                            </MenuItem>
                            {filterLayerFields.map((f) => (
                              <MenuItem key={f} value={f} sx={{ fontSize: 11 }}>
                                {f}
                              </MenuItem>
                            ))}
                          </Select>

                          {/* Operator */}
                          <Select
                            size="small"
                            value={clause.operator}
                            onChange={(e) => {
                              const u = [...filterClauses];
                              u[idx].operator = e.target.value;
                              setFilterClauses(u);
                            }}
                            sx={{ flex: 1.2, fontSize: 11, minWidth: 0 }}
                          >
                            {[
                              "is equal to",
                              "is not equal to",
                              "is greater than",
                              "is less than",
                              "contains",
                              "starts with",
                              "is blank",
                              "is not blank",
                            ].map((op) => (
                              <MenuItem
                                key={op}
                                value={op}
                                sx={{ fontSize: 11 }}
                              >
                                {op}
                              </MenuItem>
                            ))}
                          </Select>

                          {/* Value */}
                          <Box
                            sx={{ flex: 1, minWidth: 0, position: "relative" }}
                          >
                            <TextField
                              size="small"
                              placeholder="Value"
                              value={clause.value}
                              onChange={(e) => {
                                const u = [...filterClauses];
                                u[idx].value = e.target.value;
                                setFilterClauses(u);
                                if (
                                  e.target.value.length > 0 &&
                                  queryFieldValues[clause.id]
                                ) {
                                  const u2 = [...filterClauses];
                                  u2[idx].showSuggestions = true;
                                  setFilterClauses(u2);
                                }
                              }}
                              onFocus={() => {
                                if (clause.field && filterLayer) {
                                  fetchFieldValues(
                                    filterLayer,
                                    clause.field,
                                    clause.id,
                                  );
                                }
                                const u = [...filterClauses];
                                u[idx].showSuggestions = true;
                                setFilterClauses(u);
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  const u = [...filterClauses];
                                  u[idx].showSuggestions = false;
                                  setFilterClauses(u);
                                }, 200);
                              }}
                              InputProps={{
                                endAdornment: queryFieldValuesLoading[
                                  clause.id
                                ] ? (
                                  <CircularProgress size={12} />
                                ) : null,
                              }}
                              sx={{
                                width: "100%",
                                "& input": { fontSize: 11 },
                              }}
                            />
                            {/* Suggestions Dropdown */}
                            {clause.showSuggestions &&
                              queryFieldValues[clause.id]?.length > 0 && (
                                <Paper
                                  sx={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    maxHeight: 150,
                                    overflow: "auto",
                                    zIndex: 99999,
                                    border: "1px solid #1976d2",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                    bgcolor: "white",
                                  }}
                                >
                                  {queryFieldValues[clause.id]
                                    .filter(
                                      (v) =>
                                        clause.value === "" ||
                                        v
                                          .toLowerCase()
                                          .includes(clause.value.toLowerCase()),
                                    )
                                    .map((val, vi) => (
                                      <Box
                                        key={vi}
                                        onMouseDown={() => {
                                          const u = [...filterClauses];
                                          u[idx].value = val;
                                          u[idx].showSuggestions = false;
                                          setFilterClauses(u);
                                        }}
                                        sx={{
                                          px: 1.5,
                                          py: 0.6,
                                          fontSize: 11,
                                          cursor: "pointer",
                                          "&:hover": { bgcolor: "#e3f2fd" },
                                          borderBottom: "1px solid #f0f0f0",
                                        }}
                                      >
                                        {val}
                                      </Box>
                                    ))}
                                </Paper>
                              )}
                          </Box>

                          {/* Remove */}
                          <IconButton
                            size="small"
                            onClick={() =>
                              filterClauses.length > 1 &&
                              setFilterClauses(
                                filterClauses.filter((c) => c.id !== clause.id),
                              )
                            }
                            disabled={filterClauses.length === 1}
                            sx={{ color: "red", p: 0.3, flexShrink: 0 }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}

                      <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={() =>
                          setFilterClauses([
                            ...filterClauses,
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                              conjunction: "And",
                            },
                          ])
                        }
                        sx={{
                          textTransform: "none",
                          fontSize: 11,
                          color: "#1976d2",
                          mt: 0.5,
                          px: 0,
                        }}
                      >
                        Add Clause
                      </Button>
                    </Box>
                  </Box>

                  {/* Invert Where Clause filter */}

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Checkbox
                      size="small"
                      checked={filterInvertWhere}
                      onChange={(e) => setFilterInvertWhere(e.target.checked)}
                      sx={{ p: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                      Invert Where Clause
                    </Typography>
                  </Box>

                  {/* Active Filter Result - Invert Where ke neeche */}

                  {Object.keys(activeFilters).length > 0 && (
                    <Box
                      sx={{
                        mb: 1,
                        border: "1px solid #4caf50",
                        borderRadius: 1,
                        overflow: "hidden",
                        flexShrink: 0,
                      }}
                    >
                      {/* Header */}
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.8,
                          bgcolor: "#e8f5e9",
                          borderBottom: "1px solid #4caf50",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: "#2e7d32",
                            fontSize: 11,
                          }}
                        >
                          ✅ Active Filters ({Object.keys(activeFilters).length}
                          )
                        </Typography>
                      </Box>

                      {/* Layer wise list */}
                      <Box
                        sx={{
                          maxHeight: 120,
                          overflowY: "auto",
                          bgcolor: "#f9fbe7",
                        }}
                      >
                        {Object.entries(activeFilters).map(
                          ([lKey, filter], layerIdx) => {
                            const layerName =
                              Object.values(layerGroups)
                                .flatMap((g) => Object.entries(g.children))
                                .find(([k]) => k === lKey)?.[1]?.name || lKey;

                            return (
                              <Box
                                key={lKey}
                                sx={{
                                  borderBottom:
                                    layerIdx <
                                    Object.keys(activeFilters).length - 1
                                      ? "1px solid #c8e6c9"
                                      : "none",
                                  bgcolor:
                                    filterLayer === lKey
                                      ? "#f1f8e9"
                                      : "transparent",
                                }}
                              >
                                {/* Layer Name */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    px: 1.5,
                                    py: 0.5,
                                    bgcolor: "#e8f5e9",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 0.5,
                                    }}
                                  >
                                    <LayersIcon
                                      sx={{ fontSize: 12, color: "#2e7d32" }}
                                    />
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        color: "#1b5e20",
                                      }}
                                    >
                                      {layerName}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      const olLayer =
                                        wmsLayersRef.current[lKey];
                                      if (olLayer) {
                                        olLayer.getSource().updateParams({
                                          CQL_FILTER: undefined,
                                        });
                                        olLayer.getSource().refresh();
                                      }
                                      setActiveFilters((prev) => {
                                        const u = { ...prev };
                                        delete u[lKey];
                                        return u;
                                      });
                                      const wmsLayerName =
                                        layerExtentsRef.current[lKey];
                                      if (wmsLayerName) {
                                        fetch(
                                          `${GEOSERVER_CONFIG.wfsUrl}?${new URLSearchParams({ ...DEFAULT_WFS_PARAMS, typeName: wmsLayerName })}`,
                                        )
                                          .then((r) => r.json())
                                          .then((data) => {
                                            if (data.features?.length > 0) {
                                              attributeFeaturesRef.current =
                                                data.features;
                                              setAttributeColumns(
                                                Object.keys(
                                                  data.features[0].properties,
                                                ).map((key) => ({
                                                  id: key,
                                                  label: key
                                                    .toUpperCase()
                                                    .replace(/_/g, " "),
                                                })),
                                              );
                                              setAttributeData(
                                                data.features.map((f, i) => ({
                                                  id: i,
                                                  ...f.properties,
                                                })),
                                              );
                                              setAttributeLayerName(
                                                wmsLayerName,
                                              );
                                              setSelectedRows([]);
                                            }
                                          });
                                      }
                                    }}
                                    sx={{ p: 0.2 }}
                                    title="Remove filter"
                                  >
                                    <CloseIcon
                                      sx={{ fontSize: 13, color: "#f44336" }}
                                    />
                                  </IconButton>
                                </Box>

                                {/* Filter Expression - Scrollable */}
                                <Box
                                  sx={{
                                    px: 1.5,
                                    py: 0.6,
                                    maxHeight: 80,
                                    overflowY: "auto",
                                  }}
                                >
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: 10,
                                      color: "#1b5e20",
                                      fontFamily: "monospace",
                                      wordBreak: "break-all",
                                      display: "block",
                                      bgcolor: "white",
                                      p: 0.6,
                                      borderRadius: 0.5,
                                      border: "1px solid #c8e6c9",
                                    }}
                                  >
                                    {filter}
                                  </Typography>
                                </Box>
                              </Box>
                            );
                          },
                        )}
                      </Box>
                    </Box>
                  )}

                  <Divider sx={{ my: 2 }} />

                  {/* Buttons */}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.8,
                      flexShrink: 0,
                      mb: 2,
                      mt: "auto",
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      size="small"
                      startIcon={<FilterIcon />}
                      onClick={async () => {
                        if (!filterLayer) {
                          alert("Please select a layer");
                          return;
                        }
                        const conditions = filterClauses
                          .filter(
                            (c) =>
                              c.field &&
                              (c.operator === "is blank" ||
                                c.operator === "is not blank" ||
                                c.value !== ""),
                          )
                          .map((c, idx) => {
                            let condition = "";
                            switch (c.operator) {
                              case "is equal to":
                                condition = `${c.field} = '${c.value}'`;
                                break;
                              case "is not equal to":
                                condition = `${c.field} <> '${c.value}'`;
                                break;
                              case "is greater than":
                                condition = `${c.field} > ${c.value}`;
                                break;
                              case "is less than":
                                condition = `${c.field} < ${c.value}`;
                                break;
                              case "contains":
                                condition = `${c.field} LIKE '%${c.value}%'`;
                                break;
                              case "starts with":
                                condition = `${c.field} LIKE '${c.value}%'`;
                                break;
                              case "is blank":
                                condition = `${c.field} IS NULL`;
                                break;
                              case "is not blank":
                                condition = `${c.field} IS NOT NULL`;
                                break;
                              default:
                                condition = `${c.field} = '${c.value}'`;
                            }
                            if (idx > 0) {
                              return (
                                (c.conjunction === "Or" ? " OR " : " AND ") +
                                condition
                              );
                            }
                            return condition;
                          });
                        if (conditions.length === 0) {
                          alert("Please fill at least one condition");
                          return;
                        }
                        let cqlFilter = conditions.join("");
                        if (filterInvertWhere) cqlFilter = `NOT (${cqlFilter})`;
                        applyFilterToLayer(filterLayer, cqlFilter);
                        setActiveFilters((prev) => ({
                          ...prev,
                          [filterLayer]: cqlFilter,
                        }));
                        try {
                          const wmsLayerName =
                            layerExtentsRef.current[filterLayer];
                          const filteredParams = new URLSearchParams({
                            ...DEFAULT_WFS_PARAMS,
                            typeName: wmsLayerName,
                            CQL_FILTER: cqlFilter,
                          });
                          const filteredData = await (
                            await fetch(
                              `${GEOSERVER_CONFIG.wfsUrl}?${filteredParams}`,
                            )
                          ).json();
                          if (filteredData.features?.length > 0) {
                            const cols = Object.keys(
                              filteredData.features[0].properties,
                            ).map((key) => ({
                              id: key,
                              label: key.toUpperCase().replace(/_/g, " "),
                            }));
                            attributeFeaturesRef.current =
                              filteredData.features;
                            setAttributeColumns(cols);
                            setAttributeData(
                              filteredData.features.map((f, i) => ({
                                id: i,
                                ...f.properties,
                              })),
                            );
                            setAttributeLayerName(
                              `${wmsLayerName} (Filtered: ${filteredData.features.length})`,
                            );
                            setSelectedRows([]);
                          } else {
                            setAttributeData([]);
                          }
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      sx={{
                        bgcolor: "#1976d2",
                        "&:hover": { bgcolor: "#115293" },
                      }}
                    >
                      Apply Filter
                    </Button>

                    <Box sx={{ display: "flex", gap: 0.8 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={async () => {
                          const layerToReload = filterLayer;
                          const wmsLayerNameToReload =
                            layerExtentsRef.current[layerToReload];
                          const olLayerToReset = layerToReload
                            ? wmsLayersRef.current[layerToReload]
                            : null;
                          if (
                            layerToReload &&
                            activeFilters[layerToReload] &&
                            olLayerToReset
                          ) {
                            olLayerToReset.getSource().updateParams({
                              CQL_FILTER: null,
                              LAYERS: wmsLayerNameToReload,
                            });
                            olLayerToReset.getSource().refresh();
                          }
                          setActiveFilters((prev) => {
                            const updated = { ...prev };
                            delete updated[layerToReload];
                            return updated;
                          });
                          setFilterLayer("");
                          setFilterClauses([
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                            },
                          ]);
                          setFilterInvertWhere(false);
                          setFilterLayerFields([]);
                          if (wmsLayerNameToReload) {
                            try {
                              const res = await fetch(
                                `${GEOSERVER_CONFIG.wfsUrl}?${new URLSearchParams({ ...DEFAULT_WFS_PARAMS, typeName: wmsLayerNameToReload })}`,
                              );
                              const data = await res.json();
                              if (data.features?.length > 0) {
                                const cols = Object.keys(
                                  data.features[0].properties,
                                ).map((key) => ({
                                  id: key,
                                  label: key.toUpperCase().replace(/_/g, " "),
                                }));
                                const rows = data.features.map((f, i) => ({
                                  id: i,
                                  ...f.properties,
                                }));
                                attributeFeaturesRef.current = data.features;
                                setAttributeColumns(cols);
                                setAttributeData(rows);
                                setAttributeLayerName(wmsLayerNameToReload);
                                setSelectedRows([]);
                                setAttributeTableOpen(true);
                                setAttributeTableDocked(true);
                              }
                            } catch (e) {
                              console.error("Reload error:", e);
                            }
                          }
                        }}
                        sx={{ borderColor: "#ff9800", color: "#ff9800" }}
                      >
                        Clear
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          Object.keys(activeFilters).forEach((lKey) => {
                            const olLayer = wmsLayersRef.current[lKey];
                            if (olLayer) {
                              olLayer
                                .getSource()
                                .updateParams({ CQL_FILTER: undefined });
                              olLayer.getSource().refresh();
                            }
                          });
                          setActiveFilters({});
                          setFilterLayer("");
                          setQueryClauses([
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                            },
                          ]);
                          setInvertWhere(false);
                          setQueryLayerFields([]);
                        }}
                        disabled={Object.keys(activeFilters).length === 0}
                        sx={{
                          borderColor: "#f44336",
                          color: "#f44336",
                          "&:hover": {
                            bgcolor: "#ffebee",
                            borderColor: "#f44336",
                          },
                          "&.Mui-disabled": { opacity: 0.4 },
                          fontSize: 11,
                        }}
                      >
                        Clear All ({Object.keys(activeFilters).length})
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        size="small"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          setActiveTools(
                            activeTools.filter((t) => t !== "filter"),
                          );
                          setActiveTab(0);
                        }}
                        sx={{
                          borderColor: "#f44336",
                          color: "#f44336",
                          "&:hover": {
                            bgcolor: "#ffebee",
                            borderColor: "#f44336",
                          },
                        }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : activeTools.includes("assetSearch") &&
                activeTab ===
                  2 +
                    ["draw", "print", "measure", "filter", "assetSearch"]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("assetSearch") ? (
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    overflow: "hidden",
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Asset Search (Nearby)
                  </Typography>

                  {/* Point Select */}
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontWeight: 500, fontSize: 12 }}
                  >
                    Select Incident Point on Map
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1,
                      mb: 2,
                      alignItems: "center",
                    }}
                  >
                    <IconButton
                      onClick={() => {
                        isAssetSelectingRef.current = true;
                        setAssetSearchMode("selecting");
                      }}
                      sx={{
                        bgcolor: "#1976d2",
                        color: "white",
                        borderRadius: 1,
                        width: 40,
                        height: 40,
                        border:
                          assetSearchMode === "selecting"
                            ? "2px solid #000"
                            : "2px solid transparent",
                        "&:hover": { bgcolor: "#2d9905" },
                      }}
                      title="Click a Point on Map for select"
                    >
                      <LocationOnIcon fontSize="small" />
                    </IconButton>
                    {/*  */}
                    {incidentPoint && (
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 11, color: "#4caf50", fontWeight: 600 }}
                      >
                        ✓ Point selected
                      </Typography>
                    )}
                  </Box>

                  {assetSearchMode === "selecting" && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1,
                        bgcolor: "#fff3e0",
                        borderRadius: 1,
                        border: "1px solid #1976d2",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 11, color: "#e65100" }}
                      >
                        🖱️ Click on the map to select a point
                      </Typography>
                    </Box>
                  )}

                  {/* Layer Filter */}
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontWeight: 500, fontSize: 12 }}
                  >
                    Layer Filter
                  </Typography>
                  <Select
                    fullWidth
                    size="small"
                    value={assetLayerFilter}
                    onChange={(e) => setAssetLayerFilter(e.target.value)}
                    sx={{ mb: 2, bgcolor: "white" }}
                  >
                    <MenuItem value="All">All</MenuItem>
                    {Object.entries(layerGroups).map(([groupKey, group]) =>
                      Object.entries(group.children).map(
                        ([layerKey, layer]) =>
                          !layer.children && (
                            <MenuItem key={layerKey} value={layerKey}>
                              {layer.name}
                            </MenuItem>
                          ),
                      ),
                    )}
                  </Select>

                  {/* Search Range */}
                  <Typography
                    variant="body2"
                    sx={{ mb: 0.5, fontWeight: 500, fontSize: 12 }}
                  >
                    Search Range
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                      size="small"
                      type="number"
                      value={searchRange}
                      onChange={(e) =>
                        setSearchRange(Math.max(1, Number(e.target.value)))
                      }
                      sx={{ flex: 1, bgcolor: "white" }}
                      inputProps={{ min: 1 }}
                    />
                    <Select
                      size="small"
                      value={searchUnit}
                      onChange={(e) => setSearchUnit(e.target.value)}
                      sx={{ width: 120, bgcolor: "white" }}
                    >
                      <MenuItem value="meters">Meters</MenuItem>
                      <MenuItem value="kilometers">Kilometers</MenuItem>
                    </Select>
                  </Box>

                  <Divider sx={{ mb: 1 }} />

                  {/* Results */}
                  <Box sx={{ flex: 1, overflow: "auto" }}>
                    {assetSearchLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          pt: 3,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    ) : Object.keys(assetResults).length === 0 ? (
                      <Typography
                        variant="caption"
                        sx={{ color: "#999", fontSize: 11 }}
                      >
                        {incidentPoint
                          ? "Search for results "
                          : "select  point "}
                      </Typography>
                    ) : (
                      Object.entries(assetResults).map(
                        ([layerKey, { layerName, features }]) => (
                          <Box key={layerKey} sx={{ mb: 1 }}>
                            {/* Layer Header */}
                            <Box
                              onClick={() =>
                                setAssetResultsExpanded((prev) => ({
                                  ...prev,
                                  [layerKey]: !prev[layerKey],
                                }))
                              }
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                cursor: "pointer",
                                py: 0.8,
                                px: 1,
                                bgcolor: "#f0f4fa",
                                borderRadius: 1,
                                "&:hover": { bgcolor: "#e3f2fd" },
                              }}
                            >
                              {assetResultsExpanded[layerKey] ? (
                                <ExpandLess
                                  sx={{ fontSize: 18, color: "#1976d2" }}
                                />
                              ) : (
                                <ExpandMore
                                  sx={{ fontSize: 18, color: "#1976d2" }}
                                />
                              )}
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: "#1976d2",
                                  flex: 1,
                                  fontSize: 13,
                                }}
                              >
                                {layerName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: 10,
                                  bgcolor: "#1976d2",
                                  color: "white",
                                  px: 0.7,
                                  py: 0.2,
                                  borderRadius: 1,
                                }}
                              >
                                {features.length}
                              </Typography>
                            </Box>

                            {/* Features */}
                            <Collapse in={assetResultsExpanded[layerKey]}>
                              {features.map((feature, idx) => {
                                const props = feature.properties || {};
                                const displayName =
                                  props.name ||
                                  props.NAME ||
                                  props.id ||
                                  props.ID ||
                                  props.gid ||
                                  `Feature ${idx + 1}`;
                                const subText = Object.entries(props)
                                  .filter(
                                    ([k, v]) =>
                                      v !== null && v !== undefined && v !== "",
                                  )
                                  .slice(0, 2)
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(" | ");
                                return (
                                  <Box
                                    key={idx}
                                    onClick={() => zoomToAssetFeature(feature)}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      px: 1.5,
                                      py: 0.8,
                                      ml: 1,
                                      borderLeft: "2px solid #e0e0e0",
                                      cursor: "pointer",
                                      "&:hover": {
                                        bgcolor: "#e3f2fd",
                                        borderLeftColor: "#1976d2",
                                      },
                                      transition: "all 0.15s",
                                    }}
                                  >
                                    <LocationOnIcon
                                      sx={{
                                        fontSize: 16,
                                        color: "#1976d2",
                                        mr: 1,
                                        flexShrink: 0,
                                      }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: 12,
                                          fontWeight: 500,
                                          color: "#333",
                                        }}
                                        noWrap
                                      >
                                        {String(displayName)}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: 10, color: "#888" }}
                                        noWrap
                                      >
                                        {subText}
                                      </Typography>
                                    </Box>
                                    <SearchIcon
                                      sx={{
                                        fontSize: 14,
                                        color: "#1976d2",
                                        flexShrink: 0,
                                      }}
                                    />
                                  </Box>
                                );
                              })}
                            </Collapse>
                          </Box>
                        ),
                      )
                    )}
                  </Box>

                  <Divider sx={{ mt: 1, mb: 1 }} />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      onClick={performAssetSearch}
                      disabled={!incidentPoint || assetSearchLoading}
                      sx={{
                        bgcolor: "#1976d2",
                        "&:hover": { bgcolor: "#115293" },
                      }}
                    >
                      {assetSearchLoading ? (
                        <CircularProgress size={18} sx={{ color: "white" }} />
                      ) : (
                        "Search"
                      )}
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      onClick={clearAssetSearch}
                      sx={{ borderColor: "#1976d2", color: "#1976d2" }}
                    >
                      Clear
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<CloseIcon />}
                      onClick={() => {
                        clearAssetSearch();
                        setActiveTools(
                          activeTools.filter((t) => t !== "assetSearch"),
                        );
                        setActiveTab(0);
                      }}
                      sx={{
                        borderColor: "#f44336",
                        color: "#f44336",
                        "&:hover": { bgcolor: "#ffebee" },
                      }}
                    >
                      Close
                    </Button>
                  </Box>
                </Box>
              ) : activeTools.includes("query") &&
                activeTab ===
                  2 +
                    [
                      "draw",
                      "print",
                      "measure",
                      "filter",
                      "assetSearch",
                      "query",
                    ]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("query") ? (
                // QUERY TAB - YE PURA ADD KARO
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Query Features
                  </Typography>

                  {/* Select Layer */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Select Layer
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={queryLayer}
                      onChange={(e) => {
                        setQueryLayer(e.target.value);
                        fetchLayerFields(e.target.value);
                      }}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="">-- Select Layer --</MenuItem>
                      {Object.entries(layerGroups).map(([groupKey, group]) =>
                        Object.entries(group.children).map(
                          ([layerKey, layer]) => (
                            <MenuItem key={layerKey} value={layerKey}>
                              {layer.name}
                            </MenuItem>
                          ),
                        ),
                      )}
                    </Select>
                  </Box>

                  {/* Expression Builder */}
                  <Box
                    sx={{
                      border: "1px solid #ccc",
                      borderRadius: 1,
                      overflow: "visible",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        bgcolor: "#f0f4fa",
                        borderBottom: "1px solid #ccc",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: 12 }}
                      >
                        Expression
                      </Typography>
                    </Box>

                    <Box sx={{ p: 1 }}>
                      {queryClauses.map((clause, idx) => (
                        <Box
                          key={clause.id}
                          sx={{
                            display: "flex",
                            gap: 0.5,
                            alignItems: "center",
                            mb: 0.8,
                            flexWrap: "nowrap",
                          }}
                        >
                          {idx === 0 ? (
                            <Typography
                              variant="caption"
                              sx={{
                                width: 46,
                                fontSize: 12,
                                fontWeight: 500,
                                flexShrink: 0,
                              }}
                            >
                              Where
                            </Typography>
                          ) : (
                            <Select
                              size="small"
                              value={clause.conjunction || "And"}
                              onChange={(e) => {
                                const u = [...queryClauses];
                                u[idx].conjunction = e.target.value;
                                setQueryClauses(u);
                              }}
                              sx={{ width: 60, fontSize: 11 }}
                            >
                              <MenuItem value="And" sx={{ fontSize: 11 }}>
                                And
                              </MenuItem>
                              <MenuItem value="Or" sx={{ fontSize: 11 }}>
                                Or
                              </MenuItem>
                            </Select>
                          )}

                          {/* Field */}
                          <Select
                            size="small"
                            value={clause.field}
                            onChange={(e) => {
                              const u = [...queryClauses];
                              u[idx].field = e.target.value;
                              setQueryClauses(u);
                            }}
                            sx={{ flex: 1, fontSize: 11, minWidth: 0 }}
                            displayEmpty
                          >
                            <MenuItem
                              value=""
                              sx={{ fontSize: 11, color: "#aaa" }}
                            >
                              Field
                            </MenuItem>
                            {queryLayerFields.map((f) => (
                              <MenuItem key={f} value={f} sx={{ fontSize: 11 }}>
                                {f}
                              </MenuItem>
                            ))}
                          </Select>

                          {/* Operator */}
                          <Select
                            size="small"
                            value={clause.operator}
                            onChange={(e) => {
                              const u = [...queryClauses];
                              u[idx].operator = e.target.value;
                              setQueryClauses(u);
                            }}
                            sx={{ flex: 1.2, fontSize: 11, minWidth: 0 }}
                          >
                            {[
                              "is equal to",
                              "is not equal to",
                              "is greater than",
                              "is less than",
                              "contains",
                              "starts with",
                              "is blank",
                              "is not blank",
                            ].map((op) => (
                              <MenuItem
                                key={op}
                                value={op}
                                sx={{ fontSize: 11 }}
                              >
                                {op}
                              </MenuItem>
                            ))}
                          </Select>

                          {/* Value */}
                          {/* Value - Autocomplete with manual typing */}
                          <Box
                            sx={{ flex: 1, minWidth: 0, position: "relative" }}
                          >
                            <TextField
                              size="small"
                              placeholder="Value"
                              value={clause.value}
                              onChange={(e) => {
                                const u = [...queryClauses];
                                u[idx].value = e.target.value;
                                setQueryClauses(u);
                                // Filter suggestions
                                if (
                                  e.target.value.length > 0 &&
                                  queryFieldValues[clause.id]
                                ) {
                                  const u2 = [...queryClauses];
                                  u2[idx].showSuggestions = true;
                                  setQueryClauses(u2);
                                }
                              }}
                              onFocus={() => {
                                if (clause.field && queryLayer) {
                                  fetchFieldValues(
                                    queryLayer,
                                    clause.field,
                                    clause.id,
                                  );
                                }
                                const u = [...queryClauses];
                                u[idx].showSuggestions = true;
                                setQueryClauses(u);
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  const u = [...queryClauses];
                                  u[idx].showSuggestions = false;
                                  setQueryClauses(u);
                                }, 200);
                              }}
                              InputProps={{
                                endAdornment: queryFieldValuesLoading[
                                  clause.id
                                ] ? (
                                  <CircularProgress size={12} />
                                ) : null,
                              }}
                              sx={{
                                width: "100%",
                                "& input": { fontSize: 11 },
                              }}
                            />
                            {/* Suggestions Dropdown */}
                            {clause.showSuggestions &&
                              queryFieldValues[clause.id]?.length > 0 && (
                                <Paper
                                  sx={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    maxHeight: 150,
                                    overflow: "auto",
                                    zIndex: 99999,
                                    border: "1px solid #1976d2",
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                                    bgcolor: "white",
                                  }}
                                >
                                  {queryFieldValues[clause.id]
                                    .filter(
                                      (v) =>
                                        clause.value === "" ||
                                        v
                                          .toLowerCase()
                                          .includes(clause.value.toLowerCase()),
                                    )
                                    .map((val, vi) => (
                                      <Box
                                        key={vi}
                                        onMouseDown={() => {
                                          const u = [...queryClauses];
                                          u[idx].value = val;
                                          u[idx].showSuggestions = false;
                                          setQueryClauses(u);
                                        }}
                                        sx={{
                                          px: 1.5,
                                          py: 0.6,
                                          fontSize: 11,
                                          cursor: "pointer",
                                          "&:hover": { bgcolor: "#e3f2fd" },
                                          borderBottom: "1px solid #f0f0f0",
                                        }}
                                      >
                                        {val}
                                      </Box>
                                    ))}
                                </Paper>
                              )}
                          </Box>

                          {/* Remove */}
                          <IconButton
                            size="small"
                            onClick={() =>
                              queryClauses.length > 1 &&
                              setQueryClauses(
                                queryClauses.filter((c) => c.id !== clause.id),
                              )
                            }
                            disabled={queryClauses.length === 1}
                            sx={{ color: "red", p: 0.3, flexShrink: 0 }}
                          >
                            <CloseIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Box>
                      ))}

                      <Button
                        size="small"
                        startIcon={<AddIcon sx={{ fontSize: 13 }} />}
                        onClick={() =>
                          setQueryClauses([
                            ...queryClauses,
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                              conjunction: "And",
                            },
                          ])
                        }
                        sx={{
                          textTransform: "none",
                          fontSize: 11,
                          color: "#1976d2",
                          mt: 0.5,
                          px: 0,
                        }}
                      >
                        Add Clause
                      </Button>
                    </Box>
                  </Box>

                  {/* Invert Where Clause */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Checkbox
                      size="small"
                      checked={invertWhere}
                      onChange={(e) => setInvertWhere(e.target.checked)}
                      sx={{ p: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ fontSize: 12 }}>
                      Invert Where Clause
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Buttons */}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      flexShrink: 0,
                      mb: 2,
                      mt: "auto",
                    }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<SearchIcon />}
                      onClick={handleApplyQuery}
                      sx={{
                        bgcolor: "#1976d2",
                        "&:hover": { bgcolor: "#115293" },
                      }}
                    >
                      Apply
                    </Button>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setQueryLayer("");
                          setQueryClauses([
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                            },
                          ]);
                          setQueryResults([]);
                          setInvertWhere(false);
                          setQueryLayerFields([]);
                          setSelectedRows([]);
                          if (selectionLayerRef.current) {
                            selectionLayerRef.current.getSource().clear();
                            selectionLayerRef.current.changed();
                          }
                        }}
                        sx={{ borderColor: "#ff9800", color: "#ff9800" }}
                      >
                        Clear
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          setActiveTools(
                            activeTools.filter((t) => t !== "query"),
                          );
                          setActiveTab(0);
                          setQueryLayer("");
                          setQueryClauses([
                            {
                              id: Date.now(),
                              field: "",
                              operator: "is equal to",
                              value: "",
                            },
                          ]);
                          setQueryResults([]);
                          setInvertWhere(false);
                          setQueryLayerFields([]);
                        }}
                        sx={{
                          borderColor: "#f44336",
                          color: "#f44336",
                          "&:hover": {
                            bgcolor: "#ffebee",
                            borderColor: "#f44336",
                          },
                        }}
                      >
                        Close
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : activeTools.includes("select") &&
                activeTab ===
                  2 +
                    [
                      "draw",
                      "print",
                      "measure",
                      "filter",
                      "assetSearch",
                      "query",
                      "select",
                    ]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("select") ? (
                <Box
                  sx={{
                    p: 2,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    flexGrow: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Select Features
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Selection Mode
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={selectMode}
                      onChange={(e) => setSelectMode(e.target.value)}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="rectangle">⬛ Rectangle Select</MenuItem>
                      <MenuItem value="freehand">🔷 Polygon Select</MenuItem>
                    </Select>
                  </Box>

                  <Box
                    sx={{ mb: 2, p: 1.5, bgcolor: "#e3f2fd", borderRadius: 1 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ fontSize: "11px", color: "#1976d2" }}
                    >
                      {selectMode === "rectangle"
                        ? "⬛ Drag on the map to draw a rectangle"
                        : "🔷Click points on the map to draw a polygon, double-click to finish"}
                    </Typography>
                  </Box>

                  {/* Selected Layer */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Select Layer
                    </Typography>
                    <Select
                      fullWidth
                      size="small"
                      value={queryLayer}
                      onChange={(e) => {
                        setQueryLayer(e.target.value);
                      }}
                      sx={{ bgcolor: "white" }}
                    >
                      <MenuItem value="">-- Select Layer --</MenuItem>
                      {Object.entries(layerGroups).map(([groupKey, group]) =>
                        Object.entries(group.children).map(
                          ([layerKey, layer]) => (
                            <MenuItem key={layerKey} value={layerKey}>
                              {layer.name}
                            </MenuItem>
                          ),
                        ),
                      )}
                    </Select>
                  </Box>

                  {selectedRows.length > 0 && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1,
                        bgcolor: "#e8f5e9",
                        borderRadius: 1,
                        border: "1px solid #4caf50",
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontSize: 11, color: "#2e7d32", fontWeight: 600 }}
                      >
                        ✅ {selectedRows.length} features selected
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                      flex: 1,
                    }}
                  >
                    {!isDrawingActive ? (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<BuildIcon />}
                        onClick={() => {
                          if (!mapInstanceRef.current) return;
                          if (!queryLayer) {
                            alert("Please select the layer ");
                            return;
                          }
                          import("ol/interaction/DragBox").then(
                            ({ default: DragBox }) => {
                              import("ol/events/condition").then(
                                (condition) => {
                                  if (selectInteractionRef.current) {
                                    mapInstanceRef.current.removeInteraction(
                                      selectInteractionRef.current,
                                    );
                                  }
                                  const dragBox = new DragBox({
                                    condition:
                                      selectMode === "rectangle"
                                        ? (e) => e.originalEvent.button === 0
                                        : condition.never,
                                  });
                                  if (selectMode === "freehand") {
                                    if (!selectDrawLayerRef.current) {
                                      const src = new VectorSource();
                                      const lyr = new VectorLayer({
                                        source: src,
                                        style: new Style({
                                          stroke: new Stroke({
                                            color: "#ff6600",
                                            width: 2,
                                            lineDash: [5, 5],
                                          }),
                                          fill: new Fill({
                                            color: "rgba(255,102,0,0.1)",
                                          }),
                                        }),
                                        zIndex: 1001,
                                      });
                                      selectDrawLayerRef.current = lyr;
                                      mapInstanceRef.current.addLayer(lyr);
                                    }
                                    const draw = new Draw({
                                      source:
                                        selectDrawLayerRef.current.getSource(),
                                      type: "Polygon",
                                      freehand: false,
                                    });
                                    selectInteractionRef.current = draw;
                                    isDrawingActiveRef.current = true;
                                    setIsDrawingActive(true);
                                    mapInstanceRef.current.addInteraction(draw);
                                    draw.on("drawend", async (evt) => {
                                      // mapInstanceRef.current.removeInteraction(
                                      //   draw,
                                      // );
                                      // isDrawingActiveRef.current = false;
                                      // setIsDrawingActive(false);
                                      const geom = evt.feature.getGeometry();
                                      const cloned = geom
                                        .clone()
                                        .transform("EPSG:3857", "EPSG:4326");
                                      await fetchFeaturesInGeometry(cloned);
                                      setTimeout(() => {
                                        selectDrawLayerRef.current
                                          ?.getSource()
                                          .clear();
                                      }, 1000);
                                    });
                                  } else {
                                    selectInteractionRef.current = dragBox;
                                    isDrawingActiveRef.current = true;
                                    setIsDrawingActive(true);
                                    mapInstanceRef.current.addInteraction(
                                      dragBox,
                                    );
                                    dragBox.on("boxend", async () => {
                                      // mapInstanceRef.current.removeInteraction(
                                      //   dragBox,
                                      // );
                                      // isDrawingActiveRef.current = false;
                                      // setIsDrawingActive(false);
                                      const extent = dragBox
                                        .getGeometry()
                                        .getExtent();
                                      import("ol/proj").then(
                                        ({ transformExtent }) => {
                                          const extent4326 = transformExtent(
                                            extent,
                                            "EPSG:3857",
                                            "EPSG:4326",
                                          );
                                          fetchFeaturesInBbox(extent4326);
                                        },
                                      );
                                    });
                                  }
                                },
                              );
                            },
                          );
                        }}
                        sx={{
                          bgcolor: "#1976d2",
                          "&:hover": { bgcolor: "#115293" },
                        }}
                      >
                        Start Selecting
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={() => {
                          if (
                            selectInteractionRef.current &&
                            mapInstanceRef.current
                          ) {
                            mapInstanceRef.current.removeInteraction(
                              selectInteractionRef.current,
                            );
                            selectInteractionRef.current = null;
                          }
                          isDrawingActiveRef.current = false;
                          setIsDrawingActive(false);
                          selectDrawLayerRef.current?.getSource().clear();
                        }}
                        sx={{
                          bgcolor: "#ff9800",
                          "&:hover": { bgcolor: "#f57c00" },
                        }}
                      >
                        Stop Selecting
                      </Button>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 0.8,
                        mt: "auto",
                        flexShrink: 0,
                        mb: 2,
                      }}
                    >
                      {selectedRows.length > 0 && (
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={<LayersIcon />}
                          onClick={() => {
                            setAttributeTableOpen(true);
                            setAttributeTableDocked(true);
                            setTableViewMode("selected");
                          }}
                          sx={{ borderColor: "#4caf50", color: "#4caf50" }}
                        >
                          View in Attribute Table
                        </Button>
                      )}
                      <Box sx={{ display: "flex", gap: 0.8 }}>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedRows([]);
                            if (selectionLayerRef.current) {
                              selectionLayerRef.current.getSource().clear();
                              selectionLayerRef.current.changed();
                            }
                          }}
                          disabled={selectedRows.length === 0}
                          sx={{ borderColor: "#ff9800", color: "#ff9800" }}
                        >
                          Clear
                        </Button>
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          startIcon={<CloseIcon />}
                          onClick={() => {
                            setActiveTools(
                              activeTools.filter((t) => t !== "select"),
                            );
                            setActiveTab(0);
                            if (
                              selectInteractionRef.current &&
                              mapInstanceRef.current
                            ) {
                              mapInstanceRef.current.removeInteraction(
                                selectInteractionRef.current,
                              );
                            }
                            isDrawingActiveRef.current = false;
                            setIsDrawingActive(false);
                          }}
                          sx={{
                            borderColor: "#f44336",
                            color: "#f44336",
                            "&:hover": { bgcolor: "#ffebee" },
                          }}
                        >
                          Close
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : activeTools.includes("bookmark") &&
                activeTab ===
                  2 +
                    [
                      "draw",
                      "print",
                      "measure",
                      "filter",
                      "assetSearch",
                      "query",
                      "select",
                      "bookmark",
                    ]
                      .filter((t) => activeTools.includes(t))
                      .indexOf("bookmark") ? (
                <Box sx={{ p: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{ mb: 2, fontWeight: 600, color: "#1976d2" }}
                  >
                    Bookmarks
                  </Typography>

                  {/* Add Bookmark */}
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      sx={{ mb: 0.5, fontWeight: 500 }}
                    >
                      Bookmark Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Enter bookmark name"
                      value={bookmarkName}
                      onChange={(e) => setBookmarkName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSaveBookmark()
                      }
                      sx={{ mb: 1, bgcolor: "white" }}
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleSaveBookmark}
                      startIcon={<AddIcon />}
                      sx={{
                        bgcolor: "#4caf50",
                        "&:hover": { bgcolor: "#45a049" },
                      }}
                    >
                      Save Current View
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Bookmarks List */}
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Saved Bookmarks ({bookmarks.length})
                  </Typography>
                  <Box sx={{ maxHeight: 350, overflow: "auto" }}>
                    {bookmarks.length === 0 ? (
                      <Box sx={{ textAlign: "center", py: 4, color: "#999" }}>
                        <BookmarkIcon
                          sx={{ fontSize: 48, mb: 1, opacity: 0.3 }}
                        />
                        <Typography variant="body2">
                          No bookmarks saved yet
                        </Typography>
                      </Box>
                    ) : (
                      bookmarks.map((bookmark) => (
                        <Paper
                          key={bookmark.id}
                          sx={{
                            p: 1,
                            mb: 1,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <LocationOnIcon
                              sx={{ mr: 1, color: "#1976d2", fontSize: 20 }}
                            />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: 13, fontWeight: 500 }}
                                noWrap
                              >
                                {bookmark.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ fontSize: 11, color: "#888" }}
                              >
                                {bookmark.date}
                              </Typography>
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => handleGoToBookmark(bookmark)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": { bgcolor: "#e3f2fd" },
                              }}
                              title="Go to bookmark"
                            >
                              <MapIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              sx={{
                                color: "#f44336",
                                "&:hover": { bgcolor: "#ffebee" },
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<CloseIcon />}
                    onClick={() => {
                      setActiveTools(
                        activeTools.filter((t) => t !== "bookmark"),
                      );
                      setActiveTab(0);
                    }}
                    sx={{
                      borderColor: "#f44336",
                      color: "#f44336",
                      "&:hover": { bgcolor: "#ffebee" },
                    }}
                  >
                    Close
                  </Button>
                </Box>
              ) : null}
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
          {/* ADD THIS MENU BELOW */}
          <Menu
            anchorEl={layerMenuAnchor}
            open={Boolean(layerMenuAnchor)}
            onClose={handleLayerMenuClose}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{
              sx: {
                border: "2px solid #1976d2",
                boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                borderRadius: 1,
              },
            }}
          >
            <MenuItem
              onClick={handleZoomToLayer}
              sx={{
                "&:hover": {
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                },
              }}
            >
              <SvgIcon sx={{ mr: 1, fontSize: 20 }}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 5l5-2.5 5 2.5 5-2.5v11l-5 2.5-5-2.5-5 2.5V5z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="white"
                  />
                  <circle
                    cx="15.5"
                    cy="15.5"
                    r="5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    fill="white"
                  />
                  <line
                    x1="19.5"
                    y1="19.5"
                    x2="30"
                    y2="30"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="15.5"
                    y1="13"
                    x2="15.5"
                    y2="18"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1="13"
                    y1="15.5"
                    x2="18"
                    y2="15.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </SvgIcon>
              Zoom to Layer
            </MenuItem>
            <MenuItem
              onClick={handleOpenAttributeTable}
              sx={{
                "&:hover": {
                  bgcolor: "#e3f2fd",
                  color: "#1976d2",
                },
              }}
            >
              <TableViewIcon sx={{ fontSize: 20, mr: 0.8 }} />
              Attribute Table
            </MenuItem>
          </Menu>
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
                    minHeight: 28,
                    "& .MuiTab-root": {
                      minHeight: 28,
                      textTransform: "none",
                      fontSize: "11px",
                      fontWeight: 500,
                      py: 0.3,
                    },
                  }}
                >
                  <Tab label="Tools" />
                </Tabs>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  px: 1,
                  py: 0.5,
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
                    onClick={() => {
                      if (!activeTools.includes("draw")) {
                        setActiveTools([...activeTools, "draw"]);
                      }
                      // Calculate tab index
                      const drawIndex =
                        2 +
                        ["draw", "print", "measure"]
                          .filter(
                            (t) => activeTools.includes(t) || t === "draw",
                          )
                          .indexOf("draw");
                      setActiveTab(drawIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <EditIcon sx={{ color: "#1976d2", fontSize: 16 }} />
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
                    onClick={() => {
                      if (!activeTools.includes("measure")) {
                        setActiveTools([...activeTools, "measure"]);
                      }
                      const measureIndex =
                        2 +
                        ["draw", "print", "measure"]
                          .filter(
                            (t) => activeTools.includes(t) || t === "measure",
                          )
                          .indexOf("measure");
                      setActiveTab(measureIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <SquareFootIcon sx={{ color: "#1976d2", fontSize: 16 }} />
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
                    onClick={() => {
                      if (!activeTools.includes("print")) {
                        setActiveTools([...activeTools, "print"]);
                      }
                      const printIndex =
                        2 +
                        ["draw", "print", "measure"]
                          .filter(
                            (t) => activeTools.includes(t) || t === "print",
                          )
                          .indexOf("print");
                      setActiveTab(printIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <PrintIcon sx={{ color: "#1976d2", fontSize: 16 }} />
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
                    onClick={() => {
                      if (!activeTools.includes("query")) {
                        setActiveTools([...activeTools, "query"]);
                      }
                      const queryIndex =
                        2 +
                        [
                          "draw",
                          "print",
                          "measure",
                          "filter",
                          "assetSearch",
                          "query",
                        ]
                          .filter(
                            (t) => activeTools.includes(t) || t === "query",
                          )
                          .indexOf("query");
                      setActiveTab(queryIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <ManageSearchIcon sx={{ color: "#1976d2", fontSize: 16 }} />
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
                    onClick={() => {
                      if (!activeTools.includes("bookmark")) {
                        setActiveTools([...activeTools, "bookmark"]);
                      }
                      const bookmarkIndex =
                        2 +
                        [
                          "draw",
                          "print",
                          "measure",
                          "filter",
                          "assetSearch",
                          "query",
                          "select",
                          "bookmark",
                        ]
                          .filter(
                            (t) => activeTools.includes(t) || t === "bookmark",
                          )
                          .indexOf("bookmark");
                      setActiveTab(bookmarkIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <BookmarkIcon sx={{ color: "#1976d2", fontSize: 16 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Bookmark
                  </Typography>
                </Box>
                {/* Filter Tool */}
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
                    onClick={() => {
                      if (!activeTools.includes("filter")) {
                        setActiveTools([...activeTools, "filter"]);
                      }
                      const filterIndex =
                        2 +
                        ["draw", "print", "measure", "filter"]
                          .filter(
                            (t) => activeTools.includes(t) || t === "filter",
                          )
                          .indexOf("filter");
                      setActiveTab(filterIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    <FilterAltIcon sx={{ color: "#1976d2", fontSize: 16 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Filter
                  </Typography>
                </Box>

                {/* Asset Search Tool */}
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
                    onClick={() => {
                      if (!activeTools.includes("assetSearch")) {
                        setActiveTools([...activeTools, "assetSearch"]);
                      }
                      const assetIndex =
                        2 +
                        ["draw", "print", "measure", "filter", "assetSearch"]
                          .filter(
                            (t) =>
                              activeTools.includes(t) || t === "assetSearch",
                          )
                          .indexOf("assetSearch");
                      setActiveTab(assetIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": { bgcolor: "#f5f5f5" },
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      pt: 0.5,
                    }}
                  >
                    {/* Pin Icon */}
                    <PinDropIcon
                      sx={{ color: "#1976d2", fontSize: 16, lineHeight: 1 }}
                    />

                    {/* Oval Circle neeche */}
                    <Box
                      sx={{
                        width: 20,
                        height: 10,
                        mt: -0.8,
                        borderRadius: "50%",
                        background:
                          "radial-gradient(ellipse, rgba(25,118,210,0.6) 0%, rgba(25,118,210,0.1) 100%)",
                        border: "1px solid rgba(25,118,210,0.6)",
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Near Me
                  </Typography>
                </Box>

                {/* Select Tool */}
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
                    onClick={() => {
                      if (!activeTools.includes("select")) {
                        setActiveTools([...activeTools, "select"]);
                      }
                      const selectIndex =
                        2 +
                        [
                          "draw",
                          "print",
                          "measure",
                          "filter",
                          "assetSearch",
                          "query",
                          "select",
                        ]
                          .filter(
                            (t) => activeTools.includes(t) || t === "select",
                          )
                          .indexOf("select");
                      setActiveTab(selectIndex);
                      setDrawerOpen(true);
                    }}
                    sx={{
                      bgcolor: selectToolActive ? "#4caf50" : "white",
                      border: "1px solid #1976d2",
                      width: 28,
                      height: 28,
                      "&:hover": {
                        bgcolor: selectToolActive ? "#45a049" : "#f5f5f5",
                      },
                    }}
                  >
                    <AdsClickIcon
                      sx={{
                        color: selectToolActive ? "white" : "#1976d2",
                        fontSize: 16,
                      }}
                    />
                  </IconButton>
                  <Typography variant="caption" sx={{ fontSize: "10px" }}>
                    Select
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
            {/* Feature Info Popup */}
            {/* Feature Info Popup */}
            {/* Feature Info Popup */}
            {popupOpen && (
              <Rnd
                position={popupPosition}
                onDragStop={(e, d) => setPopupPosition({ x: d.x, y: d.y })}
                enableResizing={false}
                dragHandleClassName="popup-drag-handle"
                style={{ zIndex: 9999, position: "fixed" }}
              >
                <Box
                  id="popup-container"
                  sx={{
                    bgcolor: "white",
                    border: "2px solid #1976d2",
                    borderRadius: 1,
                    minWidth: 280,
                    maxWidth: 360,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                    overflow: "hidden",
                    pointerEvents: "auto",
                  }}
                >
                  {/* Header */}
                  <Box
                    className="popup-drag-handle"
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      py: 0.5,
                      px: 1.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: "move",
                      userSelect: "none",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontSize: 13, fontWeight: 600 }}
                    >
                      Feature Information
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => {
                        isPopupClosingRef.current = true;
                        setPopupOpen(false);
                        setAllPopupFeatures([]);
                        if (selectionLayerRef.current) {
                          selectionLayerRef.current.getSource().clear();
                          selectionLayerRef.current.changed();
                        }
                      }}
                      sx={{ color: "white", p: 0.3 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Content */}
                  <Box sx={{ maxHeight: 290, overflow: "auto", p: 1 }}>
                    {allPopupFeatures.map((featureData, featureIndex) => {
                      const isFeatureExpanded =
                        expandedAttributes[`feature-${featureIndex}`];
                      return (
                        <Paper
                          key={featureIndex}
                          elevation={2}
                          sx={{
                            mb: 1.5,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            onClick={() =>
                              setExpandedAttributes((prev) => ({
                                ...prev,
                                [`feature-${featureIndex}`]:
                                  !prev[`feature-${featureIndex}`],
                              }))
                            }
                            sx={{
                              bgcolor: "#e3f2fd",
                              px: 1.5,
                              py: 0.8,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              borderBottom: "1px solid #1976d2",
                              cursor: "pointer",
                              "&:hover": { bgcolor: "#bbdefb" },
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <LayersIcon
                                sx={{ fontSize: 16, color: "#1976d2" }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: 12,
                                  color: "#1976d2",
                                }}
                              >
                                {featureData.layerName}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleZoomToFeature(featureData);
                                }}
                                title="Zoom to feature"
                                sx={{
                                  bgcolor: "white",
                                  border: "1px solid #1976d2",
                                  p: 0.3,
                                  "&:hover": {
                                    bgcolor: "#1976d2",
                                    color: "white",
                                  },
                                }}
                              >
                                <SearchIcon sx={{ fontSize: 14 }} />
                              </IconButton>
                              {isFeatureExpanded ? (
                                <ExpandLess
                                  sx={{ fontSize: 18, color: "#1976d2" }}
                                />
                              ) : (
                                <ExpandMore
                                  sx={{ fontSize: 18, color: "#1976d2" }}
                                />
                              )}
                            </Box>
                          </Box>
                          <Collapse in={isFeatureExpanded} timeout="auto">
                            <Box sx={{ p: 1.5, bgcolor: "#fafafa" }}>
                              {Object.entries(featureData.properties).map(
                                ([key, value], attrIndex) => (
                                  <Box
                                    key={attrIndex}
                                    sx={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      mb: 0.8,
                                      pb: 0.8,
                                      borderBottom:
                                        attrIndex <
                                        Object.entries(featureData.properties)
                                          .length -
                                          1
                                          ? "1px solid #e0e0e0"
                                          : "none",
                                      gap: 2,
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontWeight: 600,
                                        color: "#555",
                                        fontSize: 11,
                                        textTransform: "capitalize",
                                        minWidth: "100px",
                                        flexShrink: 0,
                                      }}
                                    >
                                      {key.replace(/_/g, " ")}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontSize: 11,
                                        color: "#333",
                                        wordBreak: "break-word",
                                        textAlign: "right",
                                        flex: 1,
                                      }}
                                    >
                                      {value !== null && value !== undefined
                                        ? String(value)
                                        : "-"}
                                    </Typography>
                                  </Box>
                                ),
                              )}
                            </Box>
                          </Collapse>
                        </Paper>
                      );
                    })}
                  </Box>
                </Box>
              </Rnd>
            )}

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
                  <Paper sx={{ display: "flex", alignItems: "center" }}>
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
                anchorOrigin={{ vertical: "top", horizontal: "left" }}
                transformOrigin={{ vertical: "bottom", horizontal: "right" }}
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
                p: 0.5,
                px: 1.5,
                display: "flex",
                justifyContent: "space-between",
                zIndex: 1000,
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Select
                  size="small"
                  value={coordFormat}
                  onChange={(e) => setCoordFormat(e.target.value)}
                  sx={{ fontSize: "11px" }}
                >
                  <MenuItem value="xy">X/Y</MenuItem>
                  <MenuItem value="latlon">Lat/Lon</MenuItem>
                </Select>
                <Typography variant="caption" sx={{ fontSize: "10px" }}>
                  {coordFormat === "latlon"
                    ? convertToDMS(parseFloat(coordinates.x), true)
                    : `X: ${coordinates.x}`}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: "11px" }}>
                  {coordFormat === "latlon"
                    ? convertToDMS(parseFloat(coordinates.y), false)
                    : `Y: ${coordinates.y}`}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                <Typography variant="caption">Scale</Typography>
                <TextField
                  size="small"
                  value={scaleInput}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    // Only allow numbers
                    if (/^\d*$/.test(newValue)) {
                      setScaleInput(newValue);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && scaleInput) {
                      const newScale = parseInt(scaleInput);
                      const view = mapInstanceRef.current?.getView();
                      if (view && !isNaN(newScale) && newScale > 0) {
                        const dpi = 25.4 / 0.28;
                        const units = view.getProjection().getUnits();
                        const mpu =
                          units === "degrees" ? 111194.87428468118 : 1;
                        const resolution = newScale / (mpu * 39.37 * dpi);
                        view.setResolution(resolution);
                      }
                    }
                  }}
                  onBlur={() => {
                    // Reset to actual scale if user didn't press Enter
                    setScaleInput(scale);
                  }}
                  InputProps={{
                    startAdornment: (
                      <Typography
                        variant="caption"
                        sx={{ mr: 0.5, color: "#666" }}
                      >
                        1:
                      </Typography>
                    ),
                  }}
                  sx={{
                    fontSize: "12px",
                    width: 100,
                    "& .MuiInputBase-root": {
                      height: 26,
                      fontSize: "12px",
                    },
                    "& input": {
                      fontSize: "12px",
                      padding: "3px 3px 3px 0",
                    },
                  }}
                  placeholder="11541"
                />
              </Box>
            </Paper>
            {/* Bookmark Dialog */}

            {/* Print Preview Dialog */}
            {/* Print Preview Dialog - REDESIGNED */}
            <Dialog
              open={printPreviewOpen}
              onClose={() => setPrintPreviewOpen(false)}
              maxWidth={false}
              fullScreen
              PaperProps={{
                sx: {
                  bgcolor: "#e0e0e0",
                },
              }}
            >
              <DialogTitle sx={{ bgcolor: "#003376", color: "white", py: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" sx={{ fontSize: 16 }}>
                    Print Preview - {printTitle || "Pipeline Distribution Map"}
                  </Typography>
                  <IconButton
                    onClick={() => setPrintPreviewOpen(false)}
                    sx={{ color: "white" }}
                    size="small"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>

              <DialogContent
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  p: 3,
                  overflow: "hidden",
                }}
              >
                {/* Print Layout Container - NEW DESIGN matching wireframe */}
                {/* Print Layout Container - EXACT WIREFRAME MATCH */}
                <Box
                  id="print-container"
                  sx={{
                    width: printTemplate === "landscape" ? "297mm" : "210mm",
                    height: printTemplate === "landscape" ? "210mm" : "297mm",
                    bgcolor: "white",
                    border: "3px solid #000",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                    display: "grid",
                    // ROW 1: Header (70px)
                    // ROW 2: Map + Legend (fills remaining)
                    // ROW 3: Footer (55px) - only under map, NOT under legend
                    gridTemplateRows: "70px 1fr 55px",
                    // COL 1: Map area (fills remaining)
                    // COL 2: Right panel - map extent + legend (220px)
                    gridTemplateColumns: "1fr 220px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* ===== ROW 1, COL 1: Logo + Map Title ===== */}
                  <Box
                    sx={{
                      gridRow: "1",
                      gridColumn: "1",
                      display: "grid",
                      gridTemplateColumns: "110px 1fr",
                      borderBottom: "2.5px solid #000",
                      borderRight: "2.5px solid #000",
                    }}
                  >
                    {/* Logo */}
                    <Box
                      sx={{
                        borderRight: "2px solid #000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 1,
                        bgcolor: "#f0f4fa",
                      }}
                    >
                      <Box
                        sx={{
                          width: 52,
                          height: 36,
                          bgcolor: "#003376",
                          borderRadius: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          mb: 0.4,
                        }}
                      >
                        <Typography
                          sx={{
                            color: "white",
                            fontSize: 10,
                            fontWeight: "bold",
                            textAlign: "center",
                            lineHeight: 1.2,
                          }}
                        >
                          mapgeoid
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: 8,
                          fontWeight: "bold",
                          color: "#003376",
                        }}
                      >
                        MapGeoid
                      </Typography>
                    </Box>

                    {/* Map Title */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        p: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 17,
                          fontWeight: "bold",
                          color: "#003376",
                          letterSpacing: 0.5,
                          textAlign: "center",
                        }}
                      >
                        {printTitle || "Pipeline Distribution Map"}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "#666", mt: 0.3 }}>
                        BlueView City Gas Distribution
                      </Typography>
                    </Box>
                  </Box>

                  {/* ===== ROW 1, COL 2: Map Extent (Inset Map) ===== */}
                  <Box
                    sx={{
                      gridRow: "1",
                      gridColumn: "2",
                      borderBottom: "2.5px solid #000",
                      borderLeft: "none",
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: "6px",
                    }}
                  >
                    {/* Inner thick border box - wireframe jaisa */}
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        border: "3px solid #000",
                        position: "relative",
                        overflow: "hidden",
                        bgcolor: "#e8f4f8",
                      }}
                    >
                      {printInsetImage ? (
                        <img
                          src={printInsetImage}
                          alt="Inset Map"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            bgcolor: "#e8f4f8",
                          }}
                        />
                      )}
                      {/* Red location indicator */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: "35%",
                          left: "30%",
                          width: "30%",
                          height: "30%",
                          border: "2px solid red",
                          pointerEvents: "none",
                        }}
                      />
                    </Box>
                  </Box>

                  {/* ===== ROW 2, COL 1: Main Map ===== */}

                  {/* Wireframe mein: bada map area, N arrow top-right mein */}
                  <Box
                    sx={{
                      gridRow: "2",
                      gridColumn: "1",
                      position: "relative",
                      overflow: "hidden",
                      bgcolor: "#f0f4f8",
                      borderRight: "2.5px solid #000",
                      borderBottom: "2.5px solid #000",
                    }}
                  >
                    {printMapImage ? (
                      <img
                        src={printMapImage}
                        alt="Map"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 40,
                            fontWeight: "bold",
                            color: "#ccc",
                          }}
                        >
                          Map
                        </Typography>
                      </Box>
                    )}

                    {/* North Arrow - wireframe mein map ke andar top area mein */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 14,
                        width: 36,
                        height: 46,
                        bgcolor: "rgba(255,255,255,0.95)",
                        border: "1.5px solid #333",
                        borderRadius: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: 22,
                          fontWeight: "bold",
                          lineHeight: 1,
                          color: "#003376",
                        }}
                      >
                        ↑
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 10,
                          fontWeight: "bold",
                          color: "#003376",
                        }}
                      >
                        N
                      </Typography>
                    </Box>
                  </Box>

                  {/* ===== ROW 2, COL 2: Legend ===== */}
                  {/* Wireframe mein: map extent ke neeche, footer tak poori height */}
                  <Box
                    sx={{
                      gridRow: "2 / 4", // ← ROW 2 se ROW 3 tak (footer tak extend)
                      gridColumn: "2",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      borderLeft: "none",
                    }}
                  >
                    {/* Legend Header */}
                    <Box
                      sx={{
                        bgcolor: "white",
                        py: 0.8,
                        px: 1,
                        borderBottom: "1.5px solid #000",
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 12, fontWeight: "bold", color: "#000" }}
                      >
                        Legend
                      </Typography>
                      {/* Underline like wireframe */}
                      <Box
                        sx={{
                          width: "60%",
                          height: "2px",
                          bgcolor: "#000",
                          mx: "auto",
                          mt: 0.3,
                        }}
                      />
                    </Box>

                    {/* Legend Items */}
                    <Box
                      sx={{ flex: 1, overflow: "auto", p: 1, bgcolor: "white" }}
                    >
                      {getVisibleLayersForLegend()
                        .slice(0, 15)
                        .map((layer, index) => (
                          <Box
                            key={index}
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              mb: 0.8,
                              pb: 0.8,
                              borderBottom:
                                index < 14 ? "1px solid #ebebeb" : "none",
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 7.5,
                                fontWeight: 600,
                                color: "#222",
                                mb: 0.2,
                              }}
                            >
                              {layer.name}
                            </Typography>
                            <img
                              src={`${layer.wmsUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${layer.wmsLayer}&LEGEND_OPTIONS=fontName:Arial;fontSize:7`}
                              alt={layer.name}
                              style={{
                                display: "block",
                                maxWidth: "100%",
                                maxHeight: "32px",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          </Box>
                        ))}
                    </Box>
                  </Box>

                  {/* ===== ROW 3, COL 1 ONLY: Footer ===== */}
                  {/* Wireframe mein: footer sirf map ke neeche hai, legend ke neeche NAHI */}
                  <Box
                    sx={{
                      gridRow: "3",
                      gridColumn: "1", // ← Sirf col 1, col 2 mein legend rehta hai
                      display: "grid",
                      gridTemplateColumns: "150px 1fr 200px",
                      borderTop: "none",
                      bgcolor: "white",
                      borderRight: "2.5px solid #000",
                    }}
                  >
                    {/* Scale Bar */}
                    <Box
                      sx={{
                        borderRight: "1.5px solid #000",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        px: 1,
                        py: 0.5,
                      }}
                    >
                      <Typography
                        sx={{ fontSize: 8, fontWeight: "bold", mb: 0.4 }}
                      >
                        Scale-{getCurrentScale()}
                      </Typography>
                      <Box>
                        <Box
                          sx={{
                            display: "flex",
                            height: 10,
                            border: "1.5px solid #000",
                            width: 110,
                          }}
                        >
                          <Box
                            sx={{
                              width: "33%",
                              bgcolor: "white",
                              borderRight: "1px solid #000",
                            }}
                          />
                          <Box
                            sx={{
                              width: "33%",
                              bgcolor: "#111",
                              borderRight: "1px solid #000",
                            }}
                          />
                          <Box sx={{ width: "34%", bgcolor: "white" }} />
                        </Box>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: 110,
                            mt: 0.2,
                          }}
                        >
                          <Typography sx={{ fontSize: 6.5 }}>0</Typography>
                          <Typography sx={{ fontSize: 6.5 }}>5</Typography>
                          <Typography sx={{ fontSize: 6.5 }}>10 km</Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Note */}
                    <Box
                      sx={{
                        borderRight: "1.5px solid #000",
                        display: "flex",
                        alignItems: "center",
                        px: 1.5,
                        py: 0.5,
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: "#333" }}>
                        <strong>Note - </strong>
                        This map is for reference purposes only.
                      </Typography>
                    </Box>

                    {/* Created By + Date */}
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        px: 1.5,
                        py: 0.5,
                        gap: 0.6,
                      }}
                    >
                      <Typography sx={{ fontSize: 9, color: "#333" }}>
                        <strong>Created by-</strong> {printCreatedBy}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: "#333" }}>
                        <strong>Date-</strong>{" "}
                        {new Date().toLocaleDateString("en-GB")}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions sx={{ bgcolor: "#f5f5f5", p: 2 }}>
                <Button
                  onClick={() => setPrintPreviewOpen(false)}
                  variant="outlined"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="contained"
                  startIcon={<CloudDownloadIcon />}
                  sx={{
                    bgcolor: "#4caf50",
                    "&:hover": { bgcolor: "#45a049" },
                  }}
                >
                  Download {printFormat}
                </Button>
              </DialogActions>
            </Dialog>

            {/* Attribute Table - Draggable, Resizable, Dockable */}
            {attributeTableOpen && !attributeTableDocked && (
              <Rnd
                size={attributeTableSize}
                position={attributeTablePosition}
                onDragStop={(e, d) => {
                  setAttributeTablePosition({ x: d.x, y: d.y });
                }}
                onResizeStop={(e, direction, ref, delta, position) => {
                  setAttributeTableSize({
                    width: ref.offsetWidth,
                    height: ref.offsetHeight,
                  });
                  setAttributeTablePosition(position);
                }}
                minWidth={400}
                minHeight={300}
                enableResizing={{
                  top: true,
                  right: true,
                  bottom: true,
                  left: true,
                  topRight: true,
                  bottomRight: true,
                  bottomLeft: true,
                  topLeft: true,
                }}
                dragHandleClassName="drag-handle"
                style={{
                  zIndex: 1200,
                  position: "fixed",
                }}
              >
                <Paper
                  elevation={8}
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "2px solid #1976d2",
                    borderRadius: 1,
                    overflow: "hidden",
                  }}
                >
                  {/* Header - Draggable Handle */}
                  <Box
                    className="drag-handle"
                    sx={{
                      bgcolor: "#1976d2",
                      color: "white",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.1,
                      px: 0.3,
                      cursor: "move",
                      userSelect: "none",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <TableChartOutlinedIcon sx={{ fontSize: 18 }} />
                      <Typography variant="h6" sx={{ fontSize: 16 }}>
                        {attributeLayerName}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: "flex", gap: 0.5, alignItems: "center" }}
                    >
                      {/* ✅ NAYA - Zoom to Selected Button */}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleZoomToSelected}
                        disabled={selectedRows.length === 0}
                        startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          color: "white",
                          borderColor: "rgba(255,255,255,0.5)",
                          fontSize: 11,
                          py: 0.2,
                          px: 1,
                          "&:hover": {
                            bgcolor: "rgba(255,255,255,0.15)",
                            borderColor: "white",
                          },
                          "&.Mui-disabled": {
                            color: "rgba(255,255,255,0.4)",
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                        }}
                      >
                        Zoom to Selected
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setSelectedRows([]);
                          if (selectionLayerRef.current) {
                            selectionLayerRef.current.getSource().clear();
                            selectionLayerRef.current.changed();
                          }
                        }}
                        disabled={selectedRows.length === 0}
                        sx={{
                          color: "white",
                          borderColor: "rgba(255,100,100,0.7)",
                          fontSize: 11,
                          py: 0.2,
                          px: 1,
                          mr: 1,
                          "&:hover": {
                            bgcolor: "rgba(255,100,100,0.2)",
                            borderColor: "white",
                          },
                          "&.Mui-disabled": {
                            color: "rgba(255,255,255,0.4)",
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                        }}
                      >
                        Clear
                      </Button>
                      {/* Dock Button */}
                      <IconButton
                        onClick={() => setAttributeTableDocked(true)}
                        sx={{ color: "white" }}
                        size="small"
                        title="Dock to bottom"
                      >
                        <DockIcon />
                      </IconButton>
                      {/* Close Button */}
                      <IconButton
                        onClick={() => setAttributeTableOpen(false)}
                        sx={{ color: "white" }}
                        size="small"
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Content */}
                  <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "#f5f5f5" }}>
                    {attributeLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={60} />
                        <Typography variant="body1" color="text.secondary">
                          Loading attribute data...
                        </Typography>
                      </Box>
                    ) : attributeData.length === 0 ? (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          height: "100%",
                          flexDirection: "column",
                          gap: 2,
                          color: "#999",
                        }}
                      >
                        <LayersIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                        <Typography variant="h6">No data available</Typography>
                      </Box>
                    ) : (
                      <VirtualTable
                        attributeData={attributeData}
                        attributeColumns={attributeColumns}
                        selectedRows={selectedRows}
                        setSelectedRows={setSelectedRows}
                        updateMapSelectionFromRows={updateMapSelectionFromRows}
                        tableViewMode={tableViewMode}
                      />
                    )}
                  </Box>

                  {/* Footer */}
                  <Box
                    sx={{
                      bgcolor: "#f5f5f5",
                      borderTop: "1px solid #e0e0e0",
                      px: 1,
                      py: 0.5,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        border: "1px solid #1976d2",
                        borderRadius: 1,
                        overflow: "hidden",
                      }}
                    >
                      <Button
                        size="small"
                        onClick={() => setTableViewMode("all")}
                        sx={{
                          borderRadius: 0,
                          px: 1.5,
                          py: 0.3,
                          fontSize: 11,
                          minWidth: 0,
                          bgcolor:
                            tableViewMode === "all" ? "#1976d2" : "white",
                          color: tableViewMode === "all" ? "white" : "#1976d2",
                          "&:hover": {
                            bgcolor:
                              tableViewMode === "all" ? "#115293" : "#e3f2fd",
                          },
                        }}
                      >
                        All ({attributeData.length})
                      </Button>
                      <Box sx={{ width: "1px", bgcolor: "#1976d2" }} />
                      <Button
                        size="small"
                        onClick={() => setTableViewMode("selected")}
                        sx={{
                          borderRadius: 0,
                          px: 1.5,
                          py: 0.3,
                          fontSize: 11,
                          minWidth: 0,
                          bgcolor:
                            tableViewMode === "selected" ? "#1976d2" : "white",
                          color:
                            tableViewMode === "selected" ? "white" : "#1976d2",
                          "&:hover": {
                            bgcolor:
                              tableViewMode === "selected"
                                ? "#115293"
                                : "#e3f2fd",
                          },
                        }}
                      >
                        Selected ({selectedRows.length})
                      </Button>
                    </Box>

                    <Button
                      onClick={() => {
                        const exportData =
                          tableViewMode === "selected"
                            ? attributeData.filter((r) =>
                                selectedRows.includes(r.id),
                              )
                            : attributeData;
                        const csv = [
                          attributeColumns.map((col) => col.label).join(","),
                          ...exportData.map((row) =>
                            attributeColumns
                              .map((col) => row[col.id])
                              .join(","),
                          ),
                        ].join("\n");
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `${attributeLayerName}_data.csv`;
                        a.click();
                      }}
                      variant="outlined"
                      size="small"
                      startIcon={<CloudDownloadIcon />}
                    >
                      Export CSV
                    </Button>
                  </Box>
                </Paper>
              </Rnd>
            )}

            {/* Docked Attribute Table */}
            {attributeTableOpen && attributeTableDocked && (
              <Paper
                elevation={8}
                sx={{
                  position: "fixed",
                  bottom: 55,
                  left: drawerOpen ? drawerWidth + 5 : 20,
                  right: 53,
                  height: `${dockedTableHeight}px`,
                  zIndex: 1200,
                  display: "flex",
                  flexDirection: "column",
                  border: "2px solid #1976d2",
                  borderBottom: "none",
                  borderRadius: "8px 8px 0 0",
                  overflow: "hidden",
                  transition: "left 0.3s ease",
                }}
              >
                {/* Resize Handle - Top edge */}
                <Box
                  onMouseDown={handleDockedResizeStart}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 6,
                    cursor: "ns-resize",
                    bgcolor: "transparent",
                    zIndex: 1300,
                    "&:hover": {
                      bgcolor: "#1976d2",
                    },
                  }}
                />

                {/* Header */}
                <Box
                  sx={{
                    bgcolor: "#1976d2",
                    color: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 0.1,
                    px: 1,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TableChartOutlinedIcon sx={{ fontSize: 18 }} />
                    <Typography variant="h6" sx={{ fontSize: 16 }}>
                      {attributeLayerName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleZoomToSelected}
                      disabled={selectedRows.length === 0}
                      startIcon={<MapIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        color: "white",
                        borderColor: "rgba(255,255,255,0.5)",
                        fontSize: 11,
                        py: 0.2,
                        px: 1,
                        "&:hover": {
                          bgcolor: "rgba(255,255,255,0.15)",
                          borderColor: "white",
                        },
                        "&.Mui-disabled": {
                          color: "rgba(255,255,255,0.4)",
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                      }}
                    >
                      Zoom to Selected
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => {
                        setSelectedRows([]);
                        if (selectionLayerRef.current) {
                          selectionLayerRef.current.getSource().clear();
                          selectionLayerRef.current.changed();
                        }
                      }}
                      disabled={selectedRows.length === 0}
                      sx={{
                        color: "white",
                        borderColor: "rgba(255,100,100,0.7)",
                        fontSize: 11,
                        py: 0.2,
                        px: 1,
                        mr: 1,
                        "&:hover": {
                          bgcolor: "rgba(255,100,100,0.2)",
                          borderColor: "white",
                        },
                        "&.Mui-disabled": {
                          color: "rgba(255,255,255,0.4)",
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                      }}
                    >
                      Clear
                    </Button>
                    {/* Undock Button */}
                    <IconButton
                      onClick={() => setAttributeTableDocked(false)}
                      sx={{ color: "white" }}
                      size="small"
                      title="Undock"
                    >
                      <UndockIcon />
                    </IconButton>
                    {/* Close Button */}
                    <IconButton
                      onClick={() => setAttributeTableOpen(false)}
                      sx={{ color: "white" }}
                      size="small"
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, overflow: "hidden", bgcolor: "#f5f5f5" }}>
                  {attributeLoading ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <CircularProgress size={60} />
                      <Typography variant="body1" color="text.secondary">
                        Loading attribute data...
                      </Typography>
                    </Box>
                  ) : attributeData.length === 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "100%",
                        flexDirection: "column",
                        gap: 2,
                        color: "#999",
                      }}
                    >
                      <LayersIcon sx={{ fontSize: 64, opacity: 0.3 }} />
                      <Typography variant="h6">No data available</Typography>
                    </Box>
                  ) : (
                    <VirtualTable
                      attributeData={attributeData}
                      attributeColumns={attributeColumns}
                      selectedRows={selectedRows}
                      setSelectedRows={setSelectedRows}
                      updateMapSelectionFromRows={updateMapSelectionFromRows}
                      tableViewMode={tableViewMode}
                    />
                  )}
                </Box>

                {/* Footer */}
                <Box
                  sx={{
                    bgcolor: "#f5f5f5",
                    borderTop: "1px solid #e0e0e0",
                    px: 1,
                    py: 0.5,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      border: "1px solid #1976d2",
                      borderRadius: 1,
                      overflow: "hidden",
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => setTableViewMode("all")}
                      sx={{
                        borderRadius: 0,
                        px: 1.5,
                        py: 0.3,
                        fontSize: 11,
                        minWidth: 0,
                        bgcolor: tableViewMode === "all" ? "#1976d2" : "white",
                        color: tableViewMode === "all" ? "white" : "#1976d2",
                        "&:hover": {
                          bgcolor:
                            tableViewMode === "all" ? "#115293" : "#e3f2fd",
                        },
                      }}
                    >
                      All ({attributeData.length})
                    </Button>
                    <Box sx={{ width: "1px", bgcolor: "#1976d2" }} />
                    <Button
                      size="small"
                      onClick={() => setTableViewMode("selected")}
                      sx={{
                        borderRadius: 0,
                        px: 1.5,
                        py: 0.3,
                        fontSize: 11,
                        minWidth: 0,
                        bgcolor:
                          tableViewMode === "selected" ? "#1976d2" : "white",
                        color:
                          tableViewMode === "selected" ? "white" : "#1976d2",
                        "&:hover": {
                          bgcolor:
                            tableViewMode === "selected"
                              ? "#115293"
                              : "#e3f2fd",
                        },
                      }}
                    >
                      Selected ({selectedRows.length})
                    </Button>
                  </Box>

                  <Button
                    onClick={() => {
                      const exportData =
                        tableViewMode === "selected"
                          ? attributeData.filter((r) =>
                              selectedRows.includes(r.id),
                            )
                          : attributeData;
                      const csv = [
                        attributeColumns.map((col) => col.label).join(","),
                        ...exportData.map((row) =>
                          attributeColumns.map((col) => row[col.id]).join(","),
                        ),
                      ].join("\n");
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `${attributeLayerName}_data.csv`;
                      a.click();
                    }}
                    variant="outlined"
                    size="small"
                    startIcon={<CloudDownloadIcon />}
                  >
                    Export CSV
                  </Button>
                </Box>
              </Paper>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
// Print CSS - Add before export
if (typeof document !== "undefined") {
  const printStyles = `
    @media print {
      @page {
        size: A4 landscape;
        margin: 0;
      }
      
      body * {
        visibility: hidden;
      }
      
      #print-container,
      #print-container * {
        visibility: visible;
      }
      
      #print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        padding: 10mm;
      }
    }
  `;

  const styleElement = document.createElement("style");
  styleElement.innerHTML = printStyles;
  if (!document.head.querySelector("style[data-print-styles]")) {
    styleElement.setAttribute("data-print-styles", "true");
    document.head.appendChild(styleElement);
  }
}

// export default React.memo(App);
export default React.memo(App);
// export default App;
// Final
