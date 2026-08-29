import 'dotenv/config';
import { prisma } from './server/v2/prisma.js';

async function checkLastOrder() {
  const orders = await prisma.orders.findMany({ take: 3, orderBy: { created_at: 'desc' } });
  for (const o of orders) {
    console.log(`Order ${o.order_number}:`);
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(i => {
        console.log(`  Item ${i.name} - image: "${i.image}"`);
        const imageUrl = i.image && !i.image.startsWith('http') 
          ? `${process.env.STORE_URL || 'https://galvarsport.com'}${i.image.startsWith('/') ? '' : '/'}${i.image}`
          : i.image;
        console.log(`  -> URL generada: "${imageUrl}"`);
      });
    }
  }
  process.exit(0);
}
checkLastOrder();
