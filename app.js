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
    { value: 'elmo', label: 'ELMo' },
    { value: 'minilm', label: 'MiniLM' }
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
  const selectedPointRef = useRef(selectedPoint);
  const onPointClickRef = useRef(onPointClick);
  const sceneInitializedRef = useRef(false);
  
  useEffect(() => {
    selectedPointRef.current = selectedPoint;
    onPointClickRef.current = onPointClick;
  }, [selectedPoint, onPointClick]);

  useEffect(() => {
    if (!mountRef.current || !data) return;
    let dataKey;
    if (Array.isArray(data)) {
      dataKey = `array_${data.length}_${data[0]?.id || ''}_${data[data.length - 1]?.id || ''}`;
    } else {
      const keys = Object.keys(data);
      dataKey = `object_${keys.length}_${keys.slice(0, 3).join('_')}`;
    }
    
    if (sceneInitializedRef.current === dataKey) {
      return;
    }
    
    if (mountRef.current && mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    
    sceneInitializedRef.current = dataKey;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new window.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    
    if (controls.addEventListener) {
      renderer.domElement.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    }

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points.threshold = 0.1;
    const mouse = new THREE.Vector2();
    
    let isDragging = false;
    let mouseDownPosition = { x: 0, y: 0 };
    const DRAG_THRESHOLD = 5;

    let dataEntries;
    let dataMap = new Map();
    
    if (Array.isArray(data)) {
      dataEntries = data.map(item => {
        const id = String(item.id);
        dataMap.set(id, item);
        return [id, item];
      });
    } else {
      dataEntries = Object.entries(data).map(([id, item]) => {
        const idStr = String(id);
        dataMap.set(idStr, item);
        return [idStr, item];
      });
    }
    
    const count = dataEntries.length;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const ids = [];
    const clusters = [];

    const clusterColors = [
      new THREE.Color(0x8C1D40),
      new THREE.Color(0xFFC627),
      new THREE.Color(0xB8860B),
      new THREE.Color(0xCD5C5C),
      new THREE.Color(0x9370DB),
      new THREE.Color(0x20B2AA),
    ];
    const rawPoints = [];
    dataEntries.forEach(([id, item]) => {
      let point;
      if (item.coordinates) {
        point = item.coordinates;
      } else if (item.point) {
        point = item.point;
      } else if (Array.isArray(item)) {
        point = item;
      } else {
        point = [0, 0, 0];
      }
      if (Array.isArray(point) && point.length >= 3 && 
          typeof point[0] === 'number' && typeof point[1] === 'number' && typeof point[2] === 'number') {
        rawPoints.push(point);
      } else {
        console.warn('Invalid point data for id:', id, 'point:', point);
        rawPoints.push([0, 0, 0]);
      }
    });

    if (rawPoints.length === 0) {
      console.error('No valid points found in data!');
      return;
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    
    rawPoints.forEach(point => {
      if (point && point.length >= 3) {
        minX = Math.min(minX, point[0]);
        maxX = Math.max(maxX, point[0]);
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
        minZ = Math.min(minZ, point[2]);
        maxZ = Math.max(maxZ, point[2]);
      }
    });
    
    // Ensure we have valid bounds
    if (!isFinite(minX) || !isFinite(maxX)) {
      console.error('Invalid bounding box calculated!', { minX, maxX, minY, maxY, minZ, maxZ });
      return;
    }

    // Calculate center and scale
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const centerZ = (minZ + maxZ) / 2;
    
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const rangeZ = maxZ - minZ;
    const maxRange = Math.max(rangeX, rangeY, rangeZ, 1);
    
    const scale = 4 / maxRange;
    
    dataEntries.forEach(([id, item], index) => {
      let point, cluster;
      
      if (item.coordinates) {
        point = item.coordinates;
        cluster = item.cluster || 0;
      } else if (item.point) {
        point = item.point;
        cluster = item.cluster || 0;
      } else if (Array.isArray(item)) {
        point = item;
        cluster = 0;
      } else {
        point = [0, 0, 0];
        cluster = 0;
      }
      positions[index * 3 + 0] = (point[0] - centerX) * scale;
      positions[index * 3 + 1] = (point[1] - centerY) * scale;
      positions[index * 3 + 2] = (point[2] - centerZ) * scale;
      
      const color = clusterColors[cluster % clusterColors.length];
      colors[index * 3 + 0] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      
      ids.push(id);
      clusters.push(cluster);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.userData.ids = ids;
    geometry.userData.clusters = clusters;

    const pointSize = Math.max(0.02, Math.min(0.1, 0.05 * (4 / Math.max(maxRange, 1))));
    
    const material = new THREE.PointsMaterial({
      size: pointSize,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
      vertexColors: true
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
    
    const colorsRef = { current: colors };
    const clustersRef = { current: clusters };
    const scaleRef = { current: scale };
    const centerRef = { current: { x: centerX, y: centerY, z: centerZ } };
    const clusterColorsRef = { current: clusterColors };

    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();

    const highlightGeometry = new THREE.SphereGeometry(0.08, 16, 16);
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      transparent: true,
      opacity: 0.9
    });
    const highlightSphere = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlightSphere.visible = false;
    scene.add(highlightSphere);
    const selectedGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const selectedMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFC627,
      transparent: true,
      opacity: 0.8
    });
    const selectedSphere = new THREE.Mesh(selectedGeometry, selectedMaterial);
    selectedSphere.visible = false;
    scene.add(selectedSphere);

    const handleMouseDown = (event) => {
      mouseDownPosition.x = event.clientX;
      mouseDownPosition.y = event.clientY;
      isDragging = false;
    };

    const handleMouseMove = (event) => {
      if (mouseDownPosition.x !== 0 || mouseDownPosition.y !== 0) {
        const dx = Math.abs(event.clientX - mouseDownPosition.x);
        const dy = Math.abs(event.clientY - mouseDownPosition.y);
        if (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD) {
          isDragging = true;
        }
      }
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
          
          const item = dataMap.get(String(id));
          let point;
          if (item) {
            if (item.coordinates) {
              point = item.coordinates;
            } else if (item.point) {
              point = item.point;
            } else if (Array.isArray(item)) {
              point = item;
            }
          }
          if (point) {
            highlightSphere.position.set(point[0], point[1], point[2]);
            highlightSphere.visible = true;
          }
          
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredId(null);
          highlightSphere.visible = false;
          renderer.domElement.style.cursor = 'default';
        }
      } else {
        highlightSphere.visible = false;
        renderer.domElement.style.cursor = 'default';
      }
    };

    const handleMouseUp = (event) => {
      if (!isDragging && onPointClickRef.current) {
        const rect = renderer.domElement.getBoundingClientRect();
        
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        if (x < -1 || x > 1 || y < -1 || y > 1) {
          return;
        }
        
        mouse.x = x;
        mouse.y = y;

        controls.update();
        camera.updateMatrixWorld();
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(points);
        
        if (intersects.length > 0) {
          const intersect = intersects[0];
          
          event.stopPropagation();
          event.preventDefault();
          event.stopImmediatePropagation();
          
          const controlsEnabled = controls.enabled;
          controls.enabled = false;
          
          const savedPosition = camera.position.clone();
          const savedTarget = controls.target.clone();
          const savedZoom = camera.zoom;
          
          const index = intersect.index;
          const storedIds = geometry.userData.ids;
          const storedClusters = geometry.userData.clusters;
          const id = storedIds[index];
          const cluster = storedClusters[index];
          
          const item = dataMap.get(String(id));
          let point;
          if (item) {
            if (item.coordinates) {
              point = item.coordinates;
            } else if (item.point) {
              point = item.point;
            } else if (Array.isArray(item)) {
              point = item;
            }
          }
          
          if (point) {
            onPointClickRef.current({
              id,
              cluster,
              point: [...point]
            });
          }
          
          camera.position.copy(savedPosition);
          controls.target.copy(savedTarget);
          camera.zoom = savedZoom;
          camera.updateProjectionMatrix();
          controls.enabled = controlsEnabled;
          controls.update();
          
          requestAnimationFrame(() => {
            camera.position.copy(savedPosition);
            controls.target.copy(savedTarget);
            camera.zoom = savedZoom;
            camera.updateProjectionMatrix();
            controls.update();
          });
        }
      }
      
      mouseDownPosition.x = 0;
      mouseDownPosition.y = 0;
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      
      const currentSelectedPoint = selectedPointRef.current;
      const colorAttribute = points.geometry.attributes.color;
      const positionAttribute = points.geometry.attributes.position;
      
      if (currentSelectedPoint && currentSelectedPoint.point) {
        const storedIds = points.geometry.userData.ids;
        const pointIndex = storedIds.indexOf(String(currentSelectedPoint.id));
        
        if (pointIndex !== -1) {
          const x = positionAttribute.getX(pointIndex);
          const y = positionAttribute.getY(pointIndex);
          const z = positionAttribute.getZ(pointIndex);
          
          selectedSphere.position.set(x, y, z);
          selectedSphere.visible = true;
        } else {
          const scaledX = (currentSelectedPoint.point[0] - centerRef.current.x) * scaleRef.current;
          const scaledY = (currentSelectedPoint.point[1] - centerRef.current.y) * scaleRef.current;
          const scaledZ = (currentSelectedPoint.point[2] - centerRef.current.z) * scaleRef.current;
          selectedSphere.position.set(scaledX, scaledY, scaledZ);
          selectedSphere.visible = true;
        }
        
        const selectedCluster = currentSelectedPoint.cluster;
        const grayColor = new THREE.Color(0x333333);
        
        for (let i = 0; i < clustersRef.current.length; i++) {
          const cluster = clustersRef.current[i];
          if (cluster !== selectedCluster) {
            colorAttribute.setXYZ(i, grayColor.r, grayColor.g, grayColor.b);
          } else {
            const color = clusterColorsRef.current[cluster % clusterColorsRef.current.length];
            colorAttribute.setXYZ(i, color.r, color.g, color.b);
          }
        }
        colorAttribute.needsUpdate = true;
      } else {
        selectedSphere.visible = false;
        
        for (let i = 0; i < clustersRef.current.length; i++) {
          const cluster = clustersRef.current[i];
          const color = clusterColorsRef.current[cluster % clusterColorsRef.current.length];
          colorAttribute.setXYZ(i, color.r, color.g, color.b);
        }
        colorAttribute.needsUpdate = true;
      }
      
      renderer.render(scene, camera);
    };
    animate();
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
  }, [data]);

  const handleContainerClick = (event) => {
    event.stopPropagation();
  };

  return e('div', { className: 'visualization-container', onClick: handleContainerClick },
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
      let altFilename = `${newParams.visualizationTechnique}_${newParams.clusteringAlgorithm}_k6_${newParams.embeddingAlgorithm}.json`;
      let response = await fetch(`public/data/${altFilename}`);
      
      if (!response.ok) {
        const filename = `${newParams.visualizationTechnique}_${newParams.embeddingAlgorithm}_${newParams.clusteringAlgorithm}.json`;
        response = await fetch(`public/data/${filename}`);
        
        if (!response.ok) {
          throw new Error(`Failed to load data file. Tried: ${altFilename} and ${filename}`);
        }
      }
      
      const jsonData = await response.json();
      let processedData = jsonData;
      
      if (!Array.isArray(jsonData) && jsonData.points && Array.isArray(jsonData.points)) {
        processedData = jsonData.points;
      } else if (!Array.isArray(jsonData) && typeof jsonData === 'object') {
        const arrayValues = Object.values(jsonData).filter(v => Array.isArray(v));
        if (arrayValues.length > 0 && arrayValues[0].length > 0) {
          processedData = arrayValues[0];
        }
      }
      
      setData(processedData);
      setSelectedPoint(null);
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

  const handleClickOutside = (event) => {
    const visualizationContainer = event.target.closest('.visualization-container');
    if (!visualizationContainer && selectedPoint) {
      setSelectedPoint(null);
    }
  };

  return e('div', { className: 'app', onClick: handleClickOutside },
    e('header', { className: 'app-header' },
      e('h1', null, 'CSE573 - Group 20 - Project 9 - Document Clustering, Summarization & Visualization'),
      e('div', { className: 'header-info' },
          data && e('span', null,
            `Points: ${Array.isArray(data) ? data.length : Object.keys(data).length} | Dimension: 3`
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

