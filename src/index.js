// require("dotenv").config({path : "./.env"})
import dotenv from "dotenv";
import connect_db from "./db/index.js";
import app from "./app.js";

dotenv.config({ 
    path: "./.env" 
});

connect_db()
.then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Server is running on port ${process.env.PORT}`);
        console.log(`MongoDB connected successfully`);
    });
})
.catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
})








/*
import express from "express";
const app = express();
;(async (mongoURI) => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB successfully");
        app.on("error", (error) => {
            console.error("Error in Express app:", error);
        });
        app.listen(process.env.PORT, () => {
            console.log("Express server is running on http://localhost:3000");
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
})()
    */