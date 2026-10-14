import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    let filePath = path.join(process.cwd(), "public", "modelos", "Contas_a_Pagar_Confianca.xlsx");
    if (!fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "public", "modelos", "Contas_a_Pagar.xlsx");
    }
    if (!fs.existsSync(filePath)) {
      // Fallback para pasta modelos importacao se existir na raiz do projeto
      const altPath = path.join(process.cwd(), "..", "modelos importacao", "Contas à Pagar - Confianca.xlsx");
      if (fs.existsSync(altPath)) {
        filePath = altPath;
      } else {
        return new NextResponse("Arquivo de modelo não encontrado", { status: 404 });
      }
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Contas_a_Pagar_Modelo_Confianca.xlsx"'
      }
    });
  } catch (err: any) {
    return new NextResponse("Erro ao baixar modelo: " + err.message, { status: 500 });
  }
}
