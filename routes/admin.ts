import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { verificaTokenENivel } from "../middleware/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const adminSchema = z.object({
  nome: z
    .string()
    .min(10, { message: "Nome deve possuir, no mínimo, 10 caracteres" }),
  email: z.string().email(),
  senha: z.string(),
  nivel: z
    .number()
    .min(1, { message: "Nível, no mínimo, 1 (usuário)" })
    .max(3, { message: "Nível, no máximo, 3 (admin máximo)" }),
});

// ONGs e admins podem listar outros admins
router.get("/", verificaTokenENivel(2), async (req: Request, res: Response) => {
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        nome: true,
        email: true,
        nivel: true,
        createdAt: true,
      },
    });
    res.status(200).json(admins);
  } catch (error) {
    res.status(400).json(error);
  }
});

function validaSenha(senha: string) {
  const mensa: string[] = [];

  // .length: retorna o tamanho da string (da senha)
  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
  }

  // contadores
  let pequenas = 0;
  let grandes = 0;
  let numeros = 0;
  let simbolos = 0;

  // senha = "abc123"
  // letra = "a"

  // percorre as letras da variável senha
  for (const letra of senha) {
    // expressão regular
    if (/[a-z]/.test(letra)) {
      pequenas++;
    } else if (/[A-Z]/.test(letra)) {
      grandes++;
    } else if (/[0-9]/.test(letra)) {
      numeros++;
    } else {
      simbolos++;
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)");
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)");
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)");
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)");
  }

  return mensa;
}

// Apenas admins máximos podem criar outros admins
router.post(
  "/",
  verificaTokenENivel(3),
  async (req: Request, res: Response) => {
    const valida = adminSchema.safeParse(req.body);
    if (!valida.success) {
      res.status(400).json({ erro: valida.error });
      return;
    }

    const erros = validaSenha(valida.data.senha);
    if (erros.length > 0) {
      res.status(400).json({ erro: erros.join("; ") });
      return;
    }

    // 12 é o número de voltas (repetições) que o algoritmo faz
    // para gerar o salt (sal/tempero)
    const salt = bcrypt.genSaltSync(12);
    // gera o hash da senha acrescida do salt
    const hash = bcrypt.hashSync(valida.data.senha, salt);

    const { nome, email, nivel } = valida.data;

    // para o campo senha, atribui o hash gerado
    try {
      const admin = await prisma.admin.create({
        data: { nome, email, senha: hash, nivel },
        select: {
          id: true,
          nome: true,
          email: true,
          nivel: true,
          createdAt: true,
        },
      });
      res.status(201).json(admin);
    } catch (error) {
      res.status(400).json(error);
    }
  }
);

router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const admin = await prisma.admin.findFirst({
      where: { id },
    });
    res.status(200).json(admin);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
