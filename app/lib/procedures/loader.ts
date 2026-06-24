import * as fs from "fs"
import * as path from "path"

const PROCEDURES_DIR = path.resolve(process.cwd(), "../docs/procedures")

function loadProcedure(filename: string): string {
  const filePath = path.join(PROCEDURES_DIR, filename)
  return fs.readFileSync(filePath, "utf-8")
}

const complaintProcedure: string = loadProcedure("complaint-procedure.md")
const returnProcedure: string = loadProcedure("return-procedure.md")

export function getProcedureText(requestType: "reklamacja" | "zwrot"): string {
  if (requestType === "reklamacja") {
    return complaintProcedure
  }
  return returnProcedure
}
