import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import userRoutes from "./routes/userRoutes.js"
import shipmentRoutes from "./routes/shipments.js";
import drugRoutes from './routes/drugRoutes.js';
import bodyParser from "body-parser";
import dashboardRoutes from "./routes/dashboard.js";
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import predictionRoutes from './routes/predictions.js';



dotenv.config();
connectDB();



const app = express();

app.use(cors({
  origin: '*', 
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use("/api/auth", authRoutes);
app.use('/api/users',userRoutes)
app.use('/api/drugs', drugRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/predictions', predictionRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));