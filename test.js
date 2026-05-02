fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'I need a party outfit' }] })
}).then(r => r.json()).then(console.log).catch(console.error);
