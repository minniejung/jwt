const express = require('express');
const authRoutes = require('./routes/auth.route');

const app = express();
const port = 9090;

app.use(express.json());

app.use('/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Express 서버가 정상적으로 실행 중입니다.');
});

app.listen(port, () => {
  console.log(`🚀 서버가 실행 중입니다: http://localhost:${port}`);
});

module.exports = app;
