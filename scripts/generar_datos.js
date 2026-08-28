// scripts/generar_datos.js
// Lee lista_precios.xlsx (en la raíz del repo) y genera datos.js
// con el mismo formato que ya usa el sitio: const PRODUCTOS = [...];

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ARCHIVO_EXCEL = path.join(__dirname, "..", "lista_precios.xlsx");
const ARCHIVO_SALIDA = path.join(__dirname, "..", "datos.js");

if (!fs.existsSync(ARCHIVO_EXCEL)) {
  console.error(`No se encontró el archivo: ${ARCHIVO_EXCEL}`);
  process.exit(1);
}

const workbook = XLSX.readFile(ARCHIVO_EXCEL);
const primeraHoja = workbook.SheetNames[0];
const hoja = workbook.Sheets[primeraHoja];
const filas = XLSX.utils.sheet_to_json(hoja, { defval: "" });

const productos = filas
  .filter((fila) => String(fila.PRODUCTOID || "").trim() !== "")
  .map((fila) => ({
    codigo: String(fila.PRODUCTOID).trim(),
    descripcion: String(fila.DESCRIPCIONLARGA || "").trim(),
    existencias: Number(fila.Total_Garabatos) || 0,
    precio: Number(fila.PVENTA) || 0,
  }));

const contenido = `const PRODUCTOS = ${JSON.stringify(productos)};`;

fs.writeFileSync(ARCHIVO_SALIDA, contenido, "utf8");

console.log(`Listo: ${productos.length} productos escritos en datos.js`);
