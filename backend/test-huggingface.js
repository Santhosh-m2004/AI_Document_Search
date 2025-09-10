require('dotenv').config();
const HuggingFaceService = require('./services/huggingfaceService');

async function testHuggingFace() {
  console.log('Testing Hugging Face API...');
  console.log('API Token present:', !!process.env.HUGGING_FACE_API_TOKEN);
  
  try {
    // Test a simple query
    const response = await HuggingFaceService.generateResponse("Hello, how are you?");
    console.log('API Response:', response);
    
    // Test embedding
    const embedding = await HuggingFaceService.generateEmbedding("test text");
    console.log('Embedding generated:', !!embedding);
    
  } catch (error) {
    console.error('Error details:', error.message);
    console.error('Full error:', error);
  }
}

testHuggingFace();