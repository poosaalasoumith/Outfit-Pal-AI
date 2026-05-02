import { loadDataset } from './app/lib/loadDataset.js';

loadDataset().then(d => {
  console.log('Total items:', d.length);
  console.log('Tops:', d.filter(p => p.category === 'top').length);
  console.log('Bottoms:', d.filter(p => p.category === 'bottom').length);
  console.log('Shoes:', d.filter(p => p.category === 'shoes').length);
}).catch(console.error);
