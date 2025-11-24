const { useState, useEffect, useRef, createElement: e } = React;

// ControlPanel Component
function ControlPanel({ onLoad, loading }) {
  const [visualizationTechnique, setVisualizationTechnique] = useState('');
  const [embeddingAlgorithm, setEmbeddingAlgorithm] = useState('');
  const [clusteringAlgorithm, setClusteringAlgorithm] = useState('');

  const visualizationOptions = [
    { value: 'pca', label: 'PCA' },
    { value: 'tsne', label: 't-SNE' }
  ];

  const embeddingOptions = [
    { value: 'word2vec', label: 'Word2Vec' },
    { value: 'glove', label: 'GloVe' },
    { value: 'fasttext', label: 'FastText' },
    { value: 'bert', label: 'BERT' },
    { value: 'elmo', label: 'ELMo' }
  ];

  const clusteringOptions = [
    { value: 'kmeans', label: 'K-Means' },
    { value: 'dbscan', label: 'DBSCAN' },
    { value: 'hierarchical', label: 'Hierarchical' },
    { value: 'gmm', label: 'Gaussian Mixture Model' }
  ];

  const handleLoad = () => {
    if (!visualizationTechnique || !embeddingAlgorithm || !clusteringAlgorithm) {
      alert('Please select all options before loading data.');
      return;
    }

    onLoad({
      visualizationTechnique,
      embeddingAlgorithm,
      clusteringAlgorithm
    });
  };

  return e('div', { className: 'control-panel' },
    e('h2', null, 'CONFIGURATION'),
    e('div', { className: 'control-group' },
      e('label', { htmlFor: 'visualization' }, 'Visualization Technique'),
      e('select', {
        id: 'visualization',
        value: visualizationTechnique,
        onChange: (evt) => setVisualizationTechnique(evt.target.value),
        disabled: loading
      },
        e('option', { value: '' }, 'Select technique...'),
        ...visualizationOptions.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('div', { className: 'control-group' },
      e('label', { htmlFor: 'embedding' }, 'Embedding Algorithm'),
      e('select', {
        id: 'embedding',
        value: embeddingAlgorithm,
        onChange: (evt) => setEmbeddingAlgorithm(evt.target.value),
        disabled: loading
      },
        e('option', { value: '' }, 'Select algorithm...'),
        ...embeddingOptions.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('div', { className: 'control-group' },
      e('label', { htmlFor: 'clustering' }, 'Clustering Algorithm'),
      e('select', {
        id: 'clustering',
        value: clusteringAlgorithm,
        onChange: (evt) => setClusteringAlgorithm(evt.target.value),
        disabled: loading
      },
        e('option', { value: '' }, 'Select algorithm...'),
        ...clusteringOptions.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('button', {
      className: 'load-button',
      onClick: handleLoad,
      disabled: loading || !visualizationTechnique || !embeddingAlgorithm || !clusteringAlgorithm
    }, loading ? 'Loading...' : 'Load')
  );
}

// Visualization3D Component
function Visualization3D({ data, onPointClick, selectedPoint }) {
  const mountRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);
  const hoveredIndexRef = useRef(null);
  const selectedIndexRef = useRef(null);
  const selectedPointRef = useRef(selectedPoint);
  const onPointClickRef = useRef(onPointClick);
  const sceneInitializedRef = useRef(false);
  
  // Update refs when props change (without triggering scene recreation)
  useEffect(() => {
    selectedPointRef.current = selectedPoint;
    onPointClickRef.current = onPointClick;
  }, [selectedPoint, onPointClick]);

  useEffect(() => {
    if (!mountRef.current || !data) return;
    
    // If scene already exists for this data, don't recreate it
    const dataKey = JSON.stringify(Object.keys(data).slice(0, 10)); // Use first 10 keys as identifier
    if (sceneInitializedRef.current === dataKey) {
      return;
    }
    
    sceneInitializedRef.current = dataKey;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 4;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Controls - using the global OrbitControls from CDN
    const controls = new window.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    
    // Disable double-click to reset (if it exists)
    if (controls.addEventListener) {
      renderer.domElement.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    // Raycaster for hover detection
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1;
    const mouse = new THREE.Vector2();
    
    // Track mouse drag to prevent accidental clicks while rotating/panning
    let isDragging = false;
    let mouseDownPosition = { x: 0, y: 0 };
    const DRAG_THRESHOLD = 5; // pixels

    // Convert data to positions and colors arrays
    const dataEntries = Object.entries(data);
    const count = dataEntries.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const ids = [];
    const clusters = [];

    // ASU colors for clusters
    const clusterColors = [
      new THREE.Color(0x8C1D40), // ASU Maroon
      new THREE.Color(0xFFC627), // ASU Gold
      new THREE.Color(0xB8860B), // Dark Goldenrod
      new THREE.Color(0xCD5C5C), // Indian Red
    ];

    dataEntries.forEach(([id, item], index) => {
      const point = Array.isArray(item) ? item : item.point;
      const cluster = Array.isArray(item) ? 0 : (item.cluster || 0);
      
      positions[index * 3 + 0] = point[0];
      positions[index * 3 + 1] = point[1];
      positions[index * 3 + 2] = point[2];
      
      const color = clusterColors[cluster % clusterColors.length];
      colors[index * 3 + 0] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      
      ids.push(id);
      clusters.push(cluster);
    });

    // Create geometry and material
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData.ids = ids;
    geometry.userData.clusters = clusters;

    const material = new THREE.PointsMaterial({
      size: 0.03,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Create highlight sphere for hovered/selected points
    const highlightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    });
    const highlightSphere = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlightSphere.visible = false;
    scene.add(highlightSphere);

    // Create selected point highlight (different color)
    const selectedGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const selectedMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFC627,
      transparent: true,
      opacity: 0.8
    });
    const selectedSphere = new THREE.Mesh(selectedGeometry, selectedMaterial);
    selectedSphere.visible = false;
    scene.add(selectedSphere);

    // Mouse down handler to track drag start
    const handleMouseDown = (event) => {
      mouseDownPosition.x = event.clientX;
      mouseDownPosition.y = event.clientY;
      isDragging = false;
    };

    // Mouse move handler for hover and drag detection
    const handleMouseMove = (event) => {
      // Detect dragging
      if (mouseDownPosition.x !== 0 || mouseDownPosition.y !== 0) {
        const dx = Math.abs(event.clientX - mouseDownPosition.x);
        const dy = Math.abs(event.clientY - mouseDownPosition.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          isDragging = true;
        }
      }

      // Hover detection (only if not dragging)
      if (!isDragging) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(points);

        if (intersects.length > 0) {
          const index = intersects[0].index;
          const storedIds = geometry.userData.ids;
          const storedClusters = geometry.userData.clusters;
          const id = storedIds[index];
          const cluster = storedClusters[index];
          setHoveredId({ id, cluster });
          hoveredIndexRef.current = index;
          
          // Show highlight sphere at hovered point
          const item = data[id];
          const point = Array.isArray(item) ? item : item.point;
          highlightSphere.position.set(point[0], point[1], point[2]);
          highlightSphere.visible = true;
          
          // Change cursor to pointer
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredId(null);
          hoveredIndexRef.current = null;
          highlightSphere.visible = false;
          renderer.domElement.style.cursor = 'default';
        }
      } else {
        // Hide hover highlight while dragging
        highlightSphere.visible = false;
        renderer.domElement.style.cursor = 'default';
      }
    };

    // Mouse up handler to detect click (not drag)
    const handleMouseUp = (event) => {
      // Only trigger click if it wasn't a drag
      if (!isDragging && onPointClickRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(points);

        if (intersects.length > 0) {
          // Aggressively prevent OrbitControls from handling this event
          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
          
          // Temporarily disable controls to prevent any interference
          const controlsEnabled = controls.enabled;
          controls.enabled = false;
          
          // Save current camera state
          const savedPosition = camera.position.clone();
          const savedTarget = controls.target.clone();
          const savedZoom = camera.zoom;
          
          const index = intersects[0].index;
          const storedIds = geometry.userData.ids;
          const storedClusters = geometry.userData.clusters;
          const id = storedIds[index];
          const cluster = storedClusters[index];
          const item = data[id];
          const point = Array.isArray(item) ? item : item.point;
          
          // Call the click handler
          onPointClickRef.current({
            id,
            cluster,
            point: [...point]
          });
          
          // Immediately restore camera state and re-enable controls
          camera.position.copy(savedPosition);
          controls.target.copy(savedTarget);
          camera.zoom = savedZoom;
          camera.updateProjectionMatrix();
          controls.enabled = controlsEnabled;
          controls.update();
          
          // Also restore in next frame as a safety measure
          requestAnimationFrame(() => {
            camera.position.copy(savedPosition);
            controls.target.copy(savedTarget);
            camera.zoom = savedZoom;
            camera.updateProjectionMatrix();
            controls.update();
          });
        }
      }
      
      // Reset drag tracking
      mouseDownPosition.x = 0;
      mouseDownPosition.y = 0;
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      // Update selected point highlight (use ref to get latest value)
      const currentSelectedPoint = selectedPointRef.current;
      if (currentSelectedPoint && currentSelectedPoint.point) {
        selectedSphere.position.set(
          currentSelectedPoint.point[0], 
          currentSelectedPoint.point[1], 
          currentSelectedPoint.point[2]
        );
        selectedSphere.visible = true;
      } else {
        selectedSphere.visible = false;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      sceneInitializedRef.current = false;
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      if (mountRef.current && renderer.domElement.parentNode) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      highlightGeometry.dispose();
      highlightMaterial.dispose();
      selectedGeometry.dispose();
      selectedMaterial.dispose();
    };
  }, [data]); // Only recreate scene when data changes, not when callbacks or selectedPoint change

  return e('div', { className: 'visualization-container' },
    e('div', { ref: mountRef, className: 'visualization-canvas' }),
    hoveredId && e('div', { className: 'hover-tooltip' },
      `ID: ${hoveredId.id}`,
      e('br'),
      `Cluster: ${hoveredId.cluster}`
    )
  );
}

// Point Details Component
function PointDetails({ pointData }) {
  if (!pointData) {
    return e('div', { className: 'panel-section' },
      e('h2', null, 'DATA'),
      e('p', null, 'Select parameters in the right panel and click Load to visualize data.'),
      e('p', { style: { marginTop: '16px', fontSize: '12px', color: '#888' } },
        'Click on a point in the visualization to see details here.')
      );
  }

  return e('div', { className: 'panel-section' },
    e('h2', null, 'POINT DETAILS'),
    e('div', { className: 'point-details-content' },
      e('div', { className: 'detail-item' },
        e('strong', null, 'ID: '),
        e('span', null, pointData.id)
      ),
      e('div', { className: 'detail-item' },
        e('strong', null, 'Cluster: '),
        e('span', null, pointData.cluster)
      ),
      e('div', { className: 'detail-item' },
        e('strong', null, 'Position: '),
        e('div', { style: { marginLeft: '8px', fontFamily: 'monospace', fontSize: '12px' } },
          `X: ${pointData.point[0].toFixed(3)}`,
          e('br'),
          `Y: ${pointData.point[1].toFixed(3)}`,
          e('br'),
          `Z: ${pointData.point[2].toFixed(3)}`
        )
      )
    )
  );
}

// Main App Component
function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const handleLoad = async (newParams) => {
    setLoading(true);
    
    try {
      const filename = `${newParams.visualizationTechnique}_${newParams.embeddingAlgorithm}_${newParams.clusteringAlgorithm}.json`;
      const response = await fetch(`public/data/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load data file: ${filename}`);
      }
      
      const jsonData = await response.json();
      setData(jsonData);
      setSelectedPoint(null); // Clear selection when loading new data
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Failed to load data. Please check that the file exists for the selected combination.`);
    } finally {
      setLoading(false);
    }
  };

  const handlePointClick = (pointData) => {
    setSelectedPoint(pointData);
  };

  return e('div', { className: 'app' },
    e('header', { className: 'app-header' },
      e('h1', null, 'CSE573 - Group 20 - Project 9 - Document Clustering, Summarization & Visualization'),
      e('div', { className: 'header-info' },
        data && e('span', null,
          `Points: ${Object.keys(data).length} | Dimension: 3`
        )
      )
    ),
    e('div', { className: 'app-content' },
      e('div', { className: 'left-panel' },
        e(PointDetails, { pointData: selectedPoint })
      ),
      e('div', { className: 'center-panel' },
        loading
          ? e('div', { className: 'loading' }, 'Loading data...')
          : e(Visualization3D, { 
              data, 
              onPointClick: handlePointClick,
              selectedPoint: selectedPoint
            })
      ),
      e('div', { className: 'right-panel' },
        e(ControlPanel, { onLoad: handleLoad, loading })
      )
    )
  );
}

// Wait for OrbitControls to be ready before rendering
function initApp() {
  if (window.OrbitControls) {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(e(React.StrictMode, null, e(App)));
  } else {
    window.addEventListener('orbitControlsReady', initApp);
  }
}

// Start initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

