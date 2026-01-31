(async () => {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matricula: '07330545', senha: '1234' })
    });
    const text = await res.text();
    console.log('status:', res.status);
    console.log('body:', text);
  } catch (e) {
    console.error('fetch error', e);
    process.exit(1);
  }
})();