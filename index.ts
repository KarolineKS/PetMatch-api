import express from "express";
import cors from "cors";
import routesPets from "./routes/pets";
import routesFotos from "./routes/fotos";
import routesLogin from "./routes/login";
import routesClientes from "./routes/clientes";
import routesVisitas from "./routes/visitas";

const app = express();
const port = 3011;

app.use(express.json());
app.use(cors());

app.use("/pets", routesPets);
app.use("/fotos", routesFotos);
app.use("/login", routesLogin);
app.use("/clientes", routesClientes);
app.use("/visitas", routesVisitas);

app.get("/", (req, res) => {
  res.send("API: PetMatch");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
