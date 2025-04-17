import express from "express";
import cors from "cors";
import routesPets from "./routes/pets";
import routesFotos from "./routes/fotos";

const app = express();
const port = 3010;

app.use(express.json());
app.use(cors());

app.use("/pets", routesPets);
app.use("/fotos", routesFotos);

app.get("/", (req, res) => {
  res.send("API: Revenda de Veículos");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
