require('dotenv').config();

const cors = require('cors');
const express = require('express');
const morgan = require('morgan');

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/error.middleware');
const aiRoutes = require('./routes/ai.routes');
const assistantRoutes = require('./routes/assistant.routes');
const authRoutes = require('./routes/auth.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const exportRoutes = require('./routes/export.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const profileRoutes = require('./routes/profile.routes');
const reportRoutes = require('./routes/report.routes');
const systemRoutes = require('./routes/system.routes');
const transactionRoutes = require('./routes/transaction.routes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SmartKhata AI backend is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`SmartKhata AI backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup failed: ${error.message}`);
    process.exit(1);
  }
};

startServer();
