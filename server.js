const express = require('express');
const cors =require ('cors');
const app =express();
const studentsRoutes = require ('./routes/students')

app.use(cors());
app.use(express.json());



const PORT=3000;

app.get ('/', (req, res) => {
    res.send("server is running");
});

app.listen (PORT , () => {
    console.log('server running on ${PORT}');
});