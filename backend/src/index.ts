import express from 'express';

import clientRoutes from './routes/v1/client.js';
import consultantRoutes from './routes/v1/consultant.js';
import invoiceRoutes from './routes/v1/invoice.js';
import serviceOrderRoutes from './routes/v1/serviceOrder.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/api/v1/client', clientRoutes)
app.use('/api/v1/consultant', consultantRoutes);
app.use('/api/v1/invoice', invoiceRoutes)
app.use('/api/v1/service-order', serviceOrderRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
