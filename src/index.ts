#!/usr/bin/env node
import * as fs from 'fs-extra';
import * as path from 'path';

const configPath = path.join(__dirname, '..', '..', '@angular', 'cli', 'models', 'webpack-configs', 'common.js');
const copyConfigPath = path.join(__dirname, '..', '..', '@angular', 'cli', 'models', 'webpack-configs', 'common.original.js');

async function nativeDependencies(node_modules: string = 'node_modules') {

  let result = [];
  for (let lib of await fs.readdir(node_modules)) {
    if (await fs.pathExists(path.join(node_modules, lib, 'binding.gyp'))) {
      result.push(lib);
    }
    if (await fs.pathExists(path.join(node_modules, lib, 'node_modules'))) {
      result = result.concat(await nativeDependencies(path.join(node_modules, lib, 'node_modules')));
    }
  }
  return result;

}

async function main() {

  let externals = {};
  for (let lib of await nativeDependencies()) {
    externals[lib] = `require('${lib}')`;
  }

  if (!await fs.pathExists(copyConfigPath)) {
    await fs.copy(configPath, copyConfigPath);
  }

  let originalConfig = await fs.readFile(copyConfigPath, 'utf-8');

  let newConfig = originalConfig.replace(/return ?{/, `return {
    target: 'electron-renderer',
    externals: ${JSON.stringify(externals)}
  `);

  await fs.writeFile(configPath, newConfig);

}

