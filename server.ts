import express from 'express';
import morgan from 'morgan';
import Config from './utils/config';

const app = express();
const config = new Config();
const PORT = config.getPort();

app.use(morgan('dev'));

app.get("/api/v1", (req, res) => {
    res.send("This is api v1 entry");
});

app.listen(PORT, () => {
    console.info(`Express TS is running at port ${PORT}`);
});