const { useState, useEffect, useRef, createElement: e } = React;

function ControlPanel({ onLoad, loading, availableCombinations, onSelectionChange }) {
  const [visualizationTechnique, setVisualizationTechnique] = useState('');
  const [embeddingAlgorithm, setEmbeddingAlgorithm] = useState('');
  const [clusteringAlgorithm, setClusteringAlgorithm] = useState('');
  const [hyperparameter, setHyperparameter] = useState('');

  const getAvailableOptions = () => {
    if (!availableCombinations || Object.keys(availableCombinations).length === 0) {
      return { visualizations: [], embeddings: [], clusterings: [], hyperparameters: [] };
    }

    const visualizations = new Set();
    const embeddings = new Set();
    const clusterings = new Set();
    const hyperparamsByCluster = {};

    Object.keys(availableCombinations).forEach(key => {
      const parts = key.split('_');
      if (parts.length >= 3) {
        const cluster = parts[0];
        const embedding = parts[1];
        const hyperparam = parts.slice(2).join('_');
        
        visualizations.add('tsne');
        embeddings.add(embedding);
        clusterings.add(cluster);
        
        if (!hyperparamsByCluster[cluster]) {
          hyperparamsByCluster[cluster] = new Set();
        }
        hyperparamsByCluster[cluster].add(hyperparam);
      }
    });

    const clusterLabels = {
      'kmeans': 'K-Means',
      'dbscan': 'DBSCAN',
      'hdbscan': 'HDBSCAN',
      'aggl': 'Hierarchical',
      'spec': 'Spectral'
    };

    const embeddingLabels = {
      'minilm': 'MiniLM'
    };

    return {
      visualizations: Array.from(visualizations).map(v => ({ value: v, label: v.toUpperCase() })),
      embeddings: Array.from(embeddings).map(e => ({ value: e, label: embeddingLabels[e] || e })),
      clusterings: Array.from(clusterings).map(c => ({ value: c, label: clusterLabels[c] || c })),
      hyperparamsByCluster: Object.fromEntries(
        Object.entries(hyperparamsByCluster).map(([k, v]) => [k, Array.from(v).sort()])
      )
    };
  };

  const options = getAvailableOptions();

  const getHyperparameterLabel = (cluster, hyperparam) => {
    if (cluster === 'kmeans') {
      return `k=${hyperparam.replace('k', '')}`;
    } else if (cluster === 'dbscan') {
      return `eps=${hyperparam.replace('eps', '').replace('p', '.')}`;
    } else if (cluster === 'hdbscan') {
      return `mcs=${hyperparam.replace('mcs', '')}`;
    } else if (cluster === 'aggl' || cluster === 'spec') {
      return `n=${hyperparam.replace('n', '')}`;
    }
    return hyperparam;
  };

  const availableHyperparams = clusteringAlgorithm && options.hyperparamsByCluster[clusteringAlgorithm]
    ? options.hyperparamsByCluster[clusteringAlgorithm]
    : [];

  useEffect(() => {
    if (clusteringAlgorithm && (!availableHyperparams.includes(hyperparameter))) {
      setHyperparameter('');
    }
  }, [clusteringAlgorithm, hyperparameter, availableHyperparams]);

  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange({
        visualizationTechnique,
        embeddingAlgorithm,
        clusteringAlgorithm,
        hyperparameter
      });
    }
  }, [visualizationTechnique, embeddingAlgorithm, clusteringAlgorithm, hyperparameter, onSelectionChange]);

  const handleLoad = () => {
    if (!visualizationTechnique || !embeddingAlgorithm || !clusteringAlgorithm || !hyperparameter) {
      alert('Please select all options before loading data.');
      return;
    }

    onLoad({
      visualizationTechnique,
      embeddingAlgorithm,
      clusteringAlgorithm,
      hyperparameter
    });
  };

  return e('div', { className: 'control-panel' },
    e('div', { className: 'control-dropdown' },
      e('select', {
        value: embeddingAlgorithm,
        onChange: (evt) => setEmbeddingAlgorithm(evt.target.value),
        disabled: loading
      },
        e('option', { value: '' }, 'Select embedding...'),
        ...options.embeddings.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('div', { className: 'control-dropdown' },
      e('select', {
        value: clusteringAlgorithm,
        onChange: (evt) => {
          setClusteringAlgorithm(evt.target.value);
          setHyperparameter('');
        },
        disabled: loading
      },
        e('option', { value: '' }, 'Select clustering...'),
        ...options.clusterings.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('div', { className: 'control-dropdown' },
      e('select', {
        value: hyperparameter,
        onChange: (evt) => setHyperparameter(evt.target.value),
        disabled: loading || !clusteringAlgorithm || availableHyperparams.length === 0
      },
        e('option', { value: '' }, clusteringAlgorithm ? 'Select hyperparameter...' : 'Select clustering first...'),
        ...availableHyperparams.map(hp =>
          e('option', { key: hp, value: hp }, getHyperparameterLabel(clusteringAlgorithm, hp))
        )
      )
    ),
    e('div', { className: 'control-dropdown' },
      e('select', {
        value: visualizationTechnique,
        onChange: (evt) => setVisualizationTechnique(evt.target.value),
        disabled: loading
      },
        e('option', { value: '' }, 'Select visualization...'),
        ...options.visualizations.map(option =>
          e('option', { key: option.value, value: option.value }, option.label)
        )
      )
    ),
    e('button', {
      className: 'load-button',
      onClick: handleLoad,
      disabled: loading || !visualizationTechnique || !embeddingAlgorithm || !clusteringAlgorithm || !hyperparameter
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
    camera.position.set(0.2, 0, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new window.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enablePan = false;
    
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
    const noiseColor = new THREE.Color(0x666666);
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
    
    if (!isFinite(minX) || !isFinite(maxX)) {
      console.error('Invalid bounding box calculated!', { minX, maxX, minY, maxY, minZ, maxZ });
      return;
    }

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
        cluster = item.cluster !== undefined && item.cluster !== null ? item.cluster : 0;
      } else if (item.point) {
        point = item.point;
        cluster = item.cluster !== undefined && item.cluster !== null ? item.cluster : 0;
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
      
      let color;
      if (cluster < 0) {
        color = noiseColor;
      } else {
        const colorIndex = cluster % clusterColors.length;
        color = clusterColors[colorIndex];
      }
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
    const noiseColorRef = { current: noiseColor };

    camera.position.set(0.2, 0, 6);
    camera.lookAt(0.2, 0, 0);
    controls.target.set(0.2, 0, 0);
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
            let color;
            if (cluster < 0) {
              color = noiseColorRef.current;
            } else {
              const colorIndex = cluster % clusterColorsRef.current.length;
              color = clusterColorsRef.current[colorIndex];
            }
            colorAttribute.setXYZ(i, color.r, color.g, color.b);
          }
        }
        colorAttribute.needsUpdate = true;
      } else {
        selectedSphere.visible = false;
        
        for (let i = 0; i < clustersRef.current.length; i++) {
          const cluster = clustersRef.current[i];
          let color;
          if (cluster < 0) {
            color = noiseColorRef.current;
          } else {
            const colorIndex = cluster % clusterColorsRef.current.length;
            color = clusterColorsRef.current[colorIndex];
          }
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

// Search Component
function Search({ searchTerm, onSearchChange }) {
  return e('div', { className: 'panel-section' },
    e('h2', null, 'Search'),
    e('input', {
      type: 'text',
      className: 'search-input',
      placeholder: '',
      value: searchTerm,
      onChange: (e) => onSearchChange(e.target.value)
    })
  );
}

// Statistics Component
function Statistics({ availableCombinations, loadedSelection }) {
  if (!availableCombinations || !loadedSelection || 
      !loadedSelection.clusteringAlgorithm || !loadedSelection.embeddingAlgorithm || !loadedSelection.hyperparameter) {
    return null;
  }

  const buildCombinationKey = () => {
    const { clusteringAlgorithm, embeddingAlgorithm, hyperparameter } = loadedSelection;
    return `${clusteringAlgorithm}_${embeddingAlgorithm}_${hyperparameter}`;
  };

  const combinationKey = buildCombinationKey();
  const stats = availableCombinations[combinationKey];

  if (!stats) {
    return null;
  }

  const formatValue = (value) => {
    if (typeof value === 'number') {
      if (Math.abs(value) < 0.01) {
        return value.toExponential(2);
      }
      return value.toFixed(4);
    }
    return value;
  };

  return e('div', { className: 'statistics-window' },
    e('h2', { className: 'statistics-window-title' }, 'Statistics'),
    e('div', { className: 'statistics-box' },
      e('div', { className: 'stat-row' },
        e('span', { className: 'stat-label' }, 'Number of Clusters:'),
        e('span', { className: 'stat-value' }, stats.num_clusters || 'N/A')
      ),
      e('div', { className: 'stat-row' },
        e('span', { className: 'stat-label' }, 'Noise Fraction:'),
        e('span', { className: 'stat-value' }, formatValue(stats.noise_frac || 0))
      ),
      e('div', { className: 'stat-section' },
        e('div', { className: 'stat-section-title' }, 'Adjusted Rand Index (ARI)'),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Full:'),
          e('span', { className: 'stat-value' }, formatValue(stats.ari_full))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Sub:'),
          e('span', { className: 'stat-value' }, formatValue(stats.ari_sub))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Super:'),
          e('span', { className: 'stat-value' }, formatValue(stats.ari_super))
        )
      ),
      e('div', { className: 'stat-section' },
        e('div', { className: 'stat-section-title' }, 'Normalized Mutual Information (NMI)'),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Full:'),
          e('span', { className: 'stat-value' }, formatValue(stats.nmi_full))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Sub:'),
          e('span', { className: 'stat-value' }, formatValue(stats.nmi_sub))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Super:'),
          e('span', { className: 'stat-value' }, formatValue(stats.nmi_super))
        )
      ),
      e('div', { className: 'stat-section' },
        e('div', { className: 'stat-section-title' }, 'Purity'),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Full:'),
          e('span', { className: 'stat-value' }, formatValue(stats.purity_full))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Sub:'),
          e('span', { className: 'stat-value' }, formatValue(stats.purity_sub))
        ),
        e('div', { className: 'stat-row' },
          e('span', { className: 'stat-label' }, 'Super:'),
          e('span', { className: 'stat-value' }, formatValue(stats.purity_super))
        )
      ),
      e('div', { className: 'stat-row' },
        e('span', { className: 'stat-label' }, 'Silhouette Score:'),
        e('span', { className: 'stat-value' }, formatValue(stats.sil))
      ),
      e('div', { className: 'stat-row' },
        e('span', { className: 'stat-label' }, 'Calinski-Harabasz:'),
        e('span', { className: 'stat-value' }, formatValue(stats.ch))
      ),
      e('div', { className: 'stat-row' },
        e('span', { className: 'stat-label' }, 'Davies-Bouldin:'),
        e('span', { className: 'stat-value' }, formatValue(stats.db))
      )
    )
  );
}

// Point Details Component
function PointDetails({ pointData }) {
  if (!pointData) {
    return e('div', { className: 'panel-section' },
      e('h2', null, 'Point Info'),
      e('div', { className: 'point-info-box' },
        e('p', { style: { color: '#888', fontSize: '13px' } }, 'Click on a point in the visualization to see details here.')
      )
    );
  }

  const name = pointData.name || pointData.id || 'N/A';
  const author = pointData.author || 'N/A';
  const description = pointData.description || pointData.attributes?.description || 'No description available';

  return e('div', { className: 'panel-section' },
    e('h2', null, 'Point Info'),
    e('div', { className: 'point-info-box' },
      e('div', { className: 'point-info-item' },
        e('div', { className: 'point-info-label' }, 'ID:'),
        e('div', { className: 'point-info-value' }, pointData.id)
      ),
      e('div', { className: 'point-info-item' },
        e('div', { className: 'point-info-label' }, 'Name:'),
        e('div', { className: 'point-info-value' }, name)
      ),
      e('div', { className: 'point-info-item' },
        e('div', { className: 'point-info-label' }, 'Author:'),
        e('div', { className: 'point-info-value' }, author)
      ),
      e('div', { className: 'point-info-item', style: { marginTop: '8px' } },
        e('div', { className: 'point-info-description' }, description)
      )
    )
  );
}

// Main App Component
function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [availableCombinations, setAvailableCombinations] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadedSelection, setLoadedSelection] = useState(null);

  useEffect(() => {
    const loadCombinations = async () => {
      try {
        const response = await fetch('public/data/combination_stats.json');
        if (response.ok) {
          const stats = await response.json();
          setAvailableCombinations(stats);
        }
      } catch (error) {
        console.error('Error loading combination stats:', error);
      }
    };
    loadCombinations();
  }, []);

  const handleLoad = async (newParams) => {
    setLoading(true);
    
    try {
      const apiUrl = `http://157.245.180.194/api/vis/${newParams.visualizationTechnique}/${newParams.embeddingAlgorithm}/${newParams.clusteringAlgorithm}/${newParams.hyperparameter}`;
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load data from API: ${response.status} ${response.statusText}`);
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
      setLoadedSelection(newParams);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Failed to load data from API. Error: ${error.message}`);
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
    e('div', { className: 'app-content' },
      e('div', { className: 'left-panel' },
        e(Search, { searchTerm, onSearchChange: setSearchTerm }),
        e(PointDetails, { pointData: selectedPoint })
      ),
      e('div', { className: 'center-panel' },
        e('div', { className: 'corner-controls' },
          e(ControlPanel, { 
            onLoad: handleLoad, 
            loading, 
            availableCombinations,
            onSelectionChange: () => {}
          })
        ),
        e('div', { className: 'bottom-right-stats' },
          e(Statistics, { availableCombinations, loadedSelection })
        ),
        loading
          ? e('div', { className: 'loading' }, 'Loading data...')
          : e(Visualization3D, { 
              data, 
              onPointClick: handlePointClick,
              selectedPoint: selectedPoint
            })
      )
    )
  );
}

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

