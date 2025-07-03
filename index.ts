import express from "express";
import cors from "cors";
import routesPets from "./routes/pets";
import routesFotos from "./routes/fotos";
import routesLogin from "./routes/login";
import routesClientes from "./routes/clientes";
import routesVisitas from "./routes/visitas";
import routesMatches from "./routes/matches";
import routesCurtidas from "./routes/curtidas";
import routesHorarios from "./routes/horarios";
import routesAuth from "./routes/auth-nodemailer";
import routesAdmin from "./routes/admin";
import routesAdminLogin from "./routes/adminLogin";
import routesDashboard from "./routes/dashboard";
import routesOngs from "./routes/ongs";

const app = express();
const port = 3011;

app.use(express.json());
app.use(cors());

app.use("/pets", routesPets);
app.use("/fotos", routesFotos);
app.use("/login", routesLogin);
app.use("/clientes", routesClientes);
app.use("/visitas", routesVisitas);
app.use("/matches", routesMatches);
app.use("/curtidas", routesCurtidas);
app.use("/horarios", routesHorarios);
app.use("/auth", routesAuth);
app.use("/admin", routesAdmin);
app.use("/adminLogin", routesAdminLogin);
app.use("/dashboard", routesDashboard);
app.use("/ongs", routesOngs);

app.get("/", (req, res) => {
  res.send("API: PetMatch");
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
