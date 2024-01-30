const sharp = require('sharp');
const Jimp = require('jimp');

// Load the image using sharp
sharp('testImage.jpg')
  .toBuffer()
  .then((data) => {
    // Convert the image data to a buffer
    const imageBuffer = Buffer.from(data);

    // Calculate the Laplacian Score for blur
    const laplacianScore = calculateLaplacianScore(imageBuffer);

    // Load the image using Jimp for Luminosity and Contrast
    return Jimp.read(imageBuffer)
      .then((jimpImage) => {
        // Calculate the Luminosity Score
        const luminosityScore = calculateLuminosityScore(jimpImage);

        // Calculate the Shannon Entropy for contrast
        const contrastScore = calculateShannonEntropy(jimpImage);

        // Define weights for each metric (sum should be 1)
        const weightLaplacian = 40; // Adjust based on importance
        const weightLuminosity = 30;
        const weightContrast = 30;

        // Define the range of values for each metric (replace with actual values)
        const minLaplacian = 0;
        const maxLaplacian = 1;
        const minLuminosity = 0;
        const maxLuminosity = 255;
        const minContrast = 1; // Replace with your minimum expected contrast value
        const maxContrast = 100; // Replace with your maximum expected contrast value
        
        // Normalize scores to a common scale (between 0 and 1)
        const normalizedLaplacian = normalizeScore(laplacianScore, minLaplacian, maxLaplacian);
        const normalizedLuminosity = normalizeScore(luminosityScore, minLuminosity, maxLuminosity);
        const normalizedContrast = normalizeScore(contrastScore, minContrast, maxContrast);

   // Calculate the overall quality score
   const qualityScore = (weightLaplacian * normalizedLaplacian) +
   (weightLuminosity * normalizedLuminosity) +
   (weightContrast * normalizedContrast);

// Normalize the overall quality score to a 100 percent range
const overallQualityPercentage = (qualityScore / (weightLaplacian + weightLuminosity + weightContrast)) * 100;


       
console.log('Laplacian Score (Blur):', Math.abs(laplacianScore), laplacianScore);
console.log('Luminosity Score:', luminosityScore, luminosityScore * 255);
console.log('Contrast Score (Shannon Entropy):', contrastScore, (contrastScore * (maxContrast - minContrast)) + minContrast);
console.log('Overall Image Quality Score:', overallQualityPercentage);

      });
  })
  .catch((error) => {
    console.error('Error:', error);
  });

// Function to calculate the Laplacian Score
function calculateLaplacianScore(imageBuffer) {
  const sharpImage = sharp(imageBuffer);
  const grayscaleImage = sharpImage.toColorspace('b-w');
  const laplacianImage = grayscaleImage.convolve({
    width: 3,
    height: 3,
    kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
  });
  const laplacianData = laplacianImage.raw().toBuffer();
  const laplacianVariance = calculateVariance(laplacianData);
  return laplacianVariance;
}

// Calculate the Luminosity Score (Normalize to [0, 1])
function calculateLuminosityScore(jimpImage) {
    const width = jimpImage.bitmap.width;
    const height = jimpImage.bitmap.height;
    let luminositySum = 0;
  
    jimpImage.scan(0, 0, width, height, (x, y, idx) => {
      const r = jimpImage.bitmap.data[idx];
      const g = jimpImage.bitmap.data[idx + 1];
      const b = jimpImage.bitmap.data[idx + 2];
  
      // Calculate luminosity using the formula Y = 0.299*R + 0.587*G + 0.114*B
      const luminosity = 0.299 * r + 0.587 * g + 0.114 * b;
  
      luminositySum += luminosity;
    });
  
    const luminosityAverage = luminositySum / (width * height);
    
    // Normalize luminosity to [0, 1]
    const normalizedLuminosity = luminosityAverage / 255;
    
    return normalizedLuminosity;
  }
  
  // Calculate the Shannon Entropy for contrast (Normalize to [0, 1])
  function calculateShannonEntropy(jimpImage) {
    const width = jimpImage.bitmap.width;
    const height = jimpImage.bitmap.height;
    const histogram = new Array(256).fill(0);
  
    // Build the histogram
    jimpImage.scan(0, 0, width, height, (x, y, idx) => {
      const pixelValue = jimpImage.bitmap.data[idx];
      histogram[pixelValue]++;
    });
  
    // Calculate entropy
    let entropy = 0;
    const totalPixels = width * height;
  
    for (let i = 0; i < 256; i++) {
      const probability = histogram[i] / totalPixels;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    }
  
    // Normalize entropy to [0, 1] based on your expected min and max values
    
    // Replace minContrast and maxContrast with your specific expected range
    const minContrast =1.0; // Replace with your minimum expected contrast value
    const maxContrast = 2.0; // Replace with your maximum expected contrast value
   
// Normalize the actual entropy score within the specified range
const normalizedContrast = Math.min(Math.max((entropy - minContrast) / (maxContrast - minContrast + 1e-9), 0), 1);
  
    return normalizedContrast;
  }
  

// Function to calculate the variance of an array of data
function calculateVariance(data) {
  data = Array.from(data); // Convert data to an array
  const mean = calculateAverage(data);
  const squaredDifferences = data.map((x) => (x - mean) ** 2);
  const sumOfSquaredDifferences = squaredDifferences.reduce((a, b) => a + b, 0);
  return sumOfSquaredDifferences / (data.length - 1);
}

// Function to calculate the average of an array of data
function calculateAverage(data) {
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / data.length;
}

// Function to normalize a score to a common scale (0 to 1)
function normalizeScore(score, min, max) {
  return (score - min) / (max - min);
}


