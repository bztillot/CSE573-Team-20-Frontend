# CSE573 Team 20 Frontend

Embedding Visualizer - A lightweight React application for visualizing 3D embeddings with interactive controls, featuring Arizona State University's dark mode theme.

## Features

- **3D Visualization**: Interactive 3D scatter plot using Three.js
- **Cluster-based Coloring**: Points are colored by their cluster assignment using ASU colors
- **Parameter Selection**: Choose visualization technique, embedding algorithm, clustering algorithm, and hyperparameters
- **API Integration**: Data is loaded dynamically from a remote API
- **Point Details**: Click points to view ID, Subject, and Body information fetched from the API
- **Statistics Display**: View clustering performance metrics in the bottom-right panel
- **Search Functionality**: Search through points (search bar in left panel)
- **Hover Interaction**: Hover over points to see their IDs and cluster assignments
- **Full Camera Controls**: Rotate, zoom, and pan the 3D visualization
- **Dark Mode**: Beautiful dark theme using Arizona State University colors (Maroon #8C1D40 and Gold #FFC627)

## Getting Started

### Using Docker (Recommended)

1. Build and run with docker-compose:
```bash
docker-compose up --build
```

2. Open your browser to `http://localhost:3000`

### Manual Setup

1. Serve the files using any HTTP server. For example:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000
```

2. Open your browser to `http://localhost:8000` (or the port you chose)

**Note**: The application requires network access to fetch data from the API at `http://157.245.180.194`. CORS must be enabled on the API server for the application to work.

## Usage

1. Select a **Visualization Technique** (t-SNE or PaCMAP)
2. Select an **Embedding Algorithm** (3Large, 3Small, BGE-M3, LSA, or MiniLM)
3. Select a **Clustering Algorithm** (K-Means, DBSCAN, HDBSCAN, Hierarchical, or Spectral)
4. Select a **Hyperparameter** (options depend on the selected clustering algorithm)
5. Click **Load** to fetch and visualize the data from the API
6. Interact with the 3D visualization:
   - **Rotate**: Left-click and drag
   - **Zoom**: Scroll wheel
   - **Pan**: Right-click and drag (or middle mouse button)
   - **Hover**: Move mouse over points to see IDs and cluster assignments
   - **Click**: Click on points to view ID, Subject, and Body in the left panel
7. View **Statistics**: Clustering performance metrics appear in the bottom-right corner after loading data

## Data Source

Data is fetched from a remote API endpoint:
```
http://157.245.180.194/api/vis/{visualization}/{embedding}/{clustering}/{hyperparameter}
```

The API returns an array of point objects with the following structure:
```json
[
  {"id": "id0", "point": [x, y, z], "cluster": 0},
  {"id": "id1", "point": [x, y, z], "cluster": 1},
  ...
]
```

Additional point details (Subject and Body) are fetched from:
```
http://157.245.180.194/api/docs/{point-id}
```

Points are automatically colored based on their cluster assignment using ASU colors. Noise points (cluster < 0) are displayed in gray.

## Project Structure

```
├── public/
│   └── data/
│       └── combination_stats.json # Statistics for available combinations
├── index.html                     # Main HTML file with inline styles
├── app.js                         # Application JavaScript (React components)
├── Dockerfile                     # Docker image definition (nginx)
└── docker-compose.yml             # Docker Compose configuration
```

## Technologies

- **React 18**: UI framework (loaded from CDN)
- **Three.js**: 3D graphics library (loaded from CDN)
- **No build tools**: Pure HTML/JavaScript - no compilation needed
- **Docker**: Containerization (using nginx for static file serving)

## Team

CSE573 - Group 20 - Project 9 - Document Clustering, Summarization & Visualization

