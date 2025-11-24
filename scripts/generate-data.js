import fs from 'fs'
import path from 'path'

const combinations = [
  { viz: 'pca', embedding: 'word2vec', clustering: 'kmeans' },
  { viz: 'pca', embedding: 'word2vec', clustering: 'dbscan' },
  { viz: 'pca', embedding: 'glove', clustering: 'kmeans' },
  { viz: 'pca', embedding: 'glove', clustering: 'hierarchical' },
  { viz: 'pca', embedding: 'bert', clustering: 'gmm' },
  { viz: 'tsne', embedding: 'word2vec', clustering: 'kmeans' },
  { viz: 'tsne', embedding: 'fasttext', clustering: 'dbscan' },
  { viz: 'tsne', embedding: 'elmo', clustering: 'hierarchical' }
]

const numPoints = 1500
const numClusters = 4

function generateData() {
  const data = {}
  const clusterSizes = Array(numClusters).fill(0).map(() => Math.floor(numPoints / numClusters))
  const remainder = numPoints - clusterSizes.reduce((a, b) => a + b, 0)
  clusterSizes[0] += remainder

  let pointIndex = 0
  for (let cluster = 0; cluster < numClusters; cluster++) {
    for (let i = 0; i < clusterSizes[cluster]; i++) {
      // Create clusters with some separation
      const baseX = (cluster % 2) * 3 - 1.5
      const baseY = Math.floor(cluster / 2) * 3 - 1.5
      const baseZ = (cluster % 3) * 2 - 1
      
      data[`id${pointIndex}`] = {
        point: [
          baseX + (Math.random() - 0.5) * 2,
          baseY + (Math.random() - 0.5) * 2,
          baseZ + (Math.random() - 0.5) * 2
        ],
        cluster: cluster
      }
      pointIndex++
    }
  }
  
  return data
}

// Create data directory if it doesn't exist
const dataDir = path.join(process.cwd(), 'public', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

// Generate data files for each combination
combinations.forEach(({ viz, embedding, clustering }) => {
  const filename = `${viz}_${embedding}_${clustering}.json`
  const filepath = path.join(dataDir, filename)
  const data = generateData()
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2))
  console.log(`Generated ${filename} with ${Object.keys(data).length} points`)
})

console.log('All data files generated!')

