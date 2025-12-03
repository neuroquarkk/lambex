import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import { runRouter, workerRouter } from 'api';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.MorganFormat));

app.get('/', (_req, res) => {
    res.send('Hello');
});

app.use('/api/runs', runRouter);
app.use('/api/workers', workerRouter);

export default app;
