# CSE573 Team 20 Frontend

Embedding Visualizer - A lightweight React application for visualizing 3D embeddings with interactive controls, featuring Arizona State University's dark mode theme.

## Features

- **3D Visualization**: Interactive 3D scatter plot using Three.js
- **Cluster-based Coloring**: Points are colored by their cluster assignment using ASU colors
- **Parameter Selection**: Choose visualization technique, embedding algorithm, and clustering algorithm
- **Hover Interaction**: Hover over points to see their IDs
- **Click to Select**: Click points to view detailed information in the left panel
- **Rotate & Zoom**: Full camera controls for exploring the data
- **Dark Mode**: Beautiful dark theme using Arizona State University colors (Maroon #8C1D40 and Gold #FFC627)

## Getting Started

### Using Docker (Recommended)

1. Build and run with docker-compose:
```bash
docker-compose up --build
```

2. Open your browser to `http://localhost:3000`

### Manual Setup

1. Generate data files (optional - sample files are included):
```bash
npm run generate-data
```

2. Serve the files using any HTTP server. For example:
```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server -p 8000

# Or simply open index.html in a modern browser (may have CORS issues with fetch)
```

3. Open your browser to `http://localhost:8000` (or the port you chose)

## Usage

1. Select a **Visualization Technique** (PCA or t-SNE)
2. Select an **Embedding Algorithm** (Word2Vec, GloVe, FastText, BERT, or ELMo)
3. Select a **Clustering Algorithm** (K-Means, DBSCAN, Hierarchical, or GMM)
4. Click **Load** to load and visualize the data from the corresponding JSON file
5. Interact with the 3D visualization:
   - **Rotate**: Click and drag
   - **Zoom**: Scroll wheel
   - **Pan**: Right-click and drag (or middle mouse button)
   - **Hover**: Move mouse over points to see IDs
   - **Click**: Click on points to view details in the left panel

## Data Format

Data files are stored in `public/data/` and follow the naming convention:
`{visualization}_{embedding}_{clustering}.json`

Each JSON file contains data in the format:
```json
{
  "id0": {"point": [x, y, z], "cluster": 0},
  "id1": {"point": [x, y, z], "cluster": 1},
  ...
}
```

Points are automatically colored based on their cluster assignment using ASU colors.

## Project Structure

```
├── public/
│   └── data/                      # JSON data files
├── scripts/
│   └── generate-data.js           # Script to generate sample data
├── index.html                     # Main HTML file with inline styles
├── app.js                         # Application JavaScript (React components)
├── package.json                   # Package configuration (only for data generation script)
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

