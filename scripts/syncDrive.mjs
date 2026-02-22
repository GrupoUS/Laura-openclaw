import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_ID = '1tb1SMksWcKLTca20wTm7XSJijKOa1rad';
const LOCAL_DIR = '/Users/mauricio/.openclaw/alunos';

const driveCache = {};

function escapeShellArg(arg) {
    return `'${arg.replace(/'/g, "'\\''")}'`;
}

function gogCmd(cmd) {
  try {
    const output = execSync(`gog ${cmd} --json`, { stdio: 'pipe' }).toString();
    return JSON.parse(output);
  } catch (err) {
    if (err.stdout) {
      console.error(`gog failed: ${err.stdout.toString()}`);
    } else {
      console.error(`gog failed: ${err}`);
    }
    return null;
  }
}

function lsDrive(parentId) {
  if (driveCache[parentId]) return driveCache[parentId];
  
  const res = gogCmd(`drive ls --parent "${parentId}" --max 500`);
  const contents = {};
  if (res && res.files) {
    res.files.forEach(f => {
      contents[f.name] = { id: f.id, mimeType: f.mimeType, size: f.size };
    });
  }
  driveCache[parentId] = contents;
  return contents;
}

function mkdirDrive(name, parentId) {
  console.log(`[MKDIR] Creating folder "${name}"...`);
  const res = gogCmd(`drive mkdir ${escapeShellArg(name)} --parent "${parentId}"`);
  if (res && res.folder && res.folder.id) {
    if (!driveCache[parentId]) driveCache[parentId] = {};
    driveCache[parentId][name] = { id: res.folder.id, mimeType: 'application/vnd.google-apps.folder' };
    return res.folder.id;
  }
  return null;
}

function uploadDrive(localPath, name, parentId) {
  console.log(`[UPLOAD] Uploading file "${name}" to parent ${parentId}...`);
  const res = gogCmd(`drive upload ${escapeShellArg(localPath)} --name ${escapeShellArg(name)} --parent "${parentId}"`);
  if (res && res.file && res.file.id) {
    if (!driveCache[parentId]) driveCache[parentId] = {};
    driveCache[parentId][name] = { id: res.file.id };
    return res.file.id;
  }
  return null;
}

function syncDir(localPath, driveParentId, depth = 0) {
  const items = fs.readdirSync(localPath);
  const driveItems = lsDrive(driveParentId);

  for (const item of items) {
    if (item.startsWith('.')) continue;

    const fullPath = path.join(localPath, item);
    const stat = fs.statSync(fullPath);

    if (depth === 0 && !stat.isDirectory()) {
      continue; 
    }

    if (stat.isDirectory()) {
      let folderId = driveItems[item] ? driveItems[item].id : null;
      if (!folderId) {
        folderId = mkdirDrive(item, driveParentId);
      } else {
        console.log(`[EXISTS] Folder "${item}" already exists. (Double Check OK)`);
      }
      
      if (folderId) {
        syncDir(fullPath, folderId, depth + 1);
      } else {
        console.error(`[ERROR] Failed to get/create folder ID for ${item}`);
      }
    } else {
      if (driveItems[item]) {
        console.log(`[EXISTS] File "${item}" already exists. (Double Check OK)`);
      } else {
        uploadDrive(fullPath, item, driveParentId);
      }
    }
  }
}

console.log("Iniciando sync...");
syncDir(LOCAL_DIR, ROOT_ID);
console.log("Sync finalizado com double check!");
