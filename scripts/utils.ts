import { constants as FS_CONSTANTS, promises as fs } from 'node:fs'

export async function isExists(path: string) {
  try {
    await fs.access(path, FS_CONSTANTS.F_OK)
    return true
  } catch {
    return false
  }
}
