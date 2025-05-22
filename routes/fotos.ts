import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const prisma = new PrismaClient();
const router = Router();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    return {
      folder: "PetMatch",
      allowed_formats: ["jpg", "png", "jpeg"],
      public_id: `${Date.now()}-${file.originalname.split(".")[0]}`,
    };
  },
});

const upload = multer({ storage: storage });

const fotoSchema = z.object({
  petId: z.number().int().positive(),
  isCapa: z.boolean().default(false),
});

router.get("/:petId", async (req, res) => {
  try {
    const { petId } = req.params;
    const fotos = await prisma.foto.findMany({
      where: { petId: Number(petId) },
    });
    res.status(200).json(fotos);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar fotos" });
  }
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não encontrado" });
    }

    const petId = parseInt(req.body.petId);
    const isCapa = req.body.isCapa;

    const validatedData = fotoSchema.parse({ petId, isCapa });
    const imageUrl = req.file.path;

    console.log("Dados:", { petId, isCapa, imageUrl });

    const foto = await prisma.foto.create({
      data: {
        url: imageUrl,
        petId: validatedData.petId,
      },
      include: {
        pet: true,
      },
    });

    if (validatedData.isCapa) {
      await prisma.pet.update({
        where: { id: validatedData.petId },
        data: { fotoCapaId: foto.id },
      });
    }

    res.status(201).json(foto);
  } catch (error) {
    console.error("Erro ao criar foto:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: "Erro ao fazer upload da foto" });
  }
});

router.patch("/:id/capa", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await prisma.foto.findUnique({
      where: { id: Number(id) },
    });

    if (!foto) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }

    await prisma.pet.update({
      where: { id: foto.petId },
      data: { fotoCapaId: Number(id) },
    });

    res.status(200).json({ message: "Foto definida como capa com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao definir foto como capa" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const foto = await prisma.foto.findUnique({
      where: { id: Number(id) },
      include: { petFotoCapa: true },
    });

    if (!foto) {
      return res.status(404).json({ error: "Foto não encontrada" });
    }

    if (foto.petFotoCapa) {
      await prisma.pet.update({
        where: { id: foto.petFotoCapa.id },
        data: { fotoCapaId: null },
      });
    }

    const publicId = foto.url.split("/").pop()?.split(".")[0];
    if (publicId) {
      await cloudinary.uploader.destroy(`petmatch/${publicId}`);
    }

    await prisma.foto.delete({
      where: { id: Number(id) },
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar foto" });
  }
});

export default router;
