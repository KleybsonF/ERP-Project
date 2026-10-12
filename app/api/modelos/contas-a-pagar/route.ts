import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "modelos", "Contas_a_Pagar.xlsx");
    if (!fs.existsSync(filePath)) {
      return new NextResponse("Arquivo de modelo não encontrado", { status: 404 });
    }
    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Contas_a_Pagar_Modelo.xlsx"'
      }
    });
  } catch (err: any) {
    return new NextResponse("Erro ao baixar modelo: " + err.message, { status: 500 });
  }
}
