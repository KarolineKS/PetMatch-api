import { Router } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();
const router = Router();

const fotoSchema = z.object({
  descricao: z.string(),
  carroId: z.coerce.number(),
});

router.get("/", async (req, res) => {
  try {
    const fotos = await prisma.foto.findMany({
      include: {
        carro: true,
      },
    });
    res.status(200).json(fotos);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

cloudinary.config({
  cloud_name: "dunngnd9p",
  api_key: "387524455223584",
  api_secret: "8mR8-VyMzeCYd7EzLJWrSOeGpgA",
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "Revenda",
      allowed_formats: ["jpg", "png", "jpeg"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage });

router.post("/", upload.single("image"), async (req, res) => {
  const valida = fotoSchema.safeParse(req.body);

  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  if (!req.file || !req.file.path) {
    res.status(400).json({ erro: "Erro ao fazer upload da imagem" });
    return;
  }

  const { descricao, carroId } = valida.data;
  const { path } = req.file;

  try {
    const foto = await prisma.foto.create({
      data: {
        descricao,
        carroId,
        url: path,
      },
    });
    res.status(201).json(foto);
  } catch (error) {
    res.status(400).json({ error });
  }
});

export default router;
