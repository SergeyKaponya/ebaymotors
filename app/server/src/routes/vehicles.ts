import { Router, Request, Response } from 'express';
import { store } from '../services/store';

export const vehiclesRouter = Router();

vehiclesRouter.get('/', (req: Request, res: Response) => {
  res.json(store.listVehicles());
});

vehiclesRouter.post('/', (req: Request, res: Response) => {
  const { make, model, year, vin } = req.body || {};
  if (!make || !model || !year) {
    return res.status(400).json({ error: 'make, model, year are required' });
  }
  const vehicle = store.createVehicle({ make, model, year: Number(year), vin });
  res.status(201).json(vehicle);
});
