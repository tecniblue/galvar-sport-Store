import fetch from 'node-fetch';

async function checkBootstrap() {
  const response = await fetch('http://localhost:3001/api/bootstrap');
  const data = await response.json();
  console.log("Bootstrap Products Count:", data.products.length);
  if (data.products.length > 0) {
    console.log("First product:", JSON.stringify(data.products[0], null, 2));
  }
}

checkBootstrap().catch(err => console.error("Server might not be running at 3001:", err.message));
