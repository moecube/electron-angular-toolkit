#!/usr/bin/env node
import { AngularCliConfig } from './angular-cli-config';
import * as electronBuilder from 'electron-builder';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as console from 'console';
import * as npm from 'npm';
import * as process from 'process';
import { Package } from './package';
import { ncp } from "ncp";
import {fs} from "mz";
import 'core-js';
class Main {

    private static configPath = path.join(__dirname, '..', '..', '@angular','cli', 'models', 'webpack-configs','common.js');
    private static copyConfigPath = path.join(__dirname, '..', '..', '@angular','cli', 'models', 'webpack-configs','common.original.js');

    private static fileExists(path: string): Promise<boolean> {
        return fs.exists(path);
    }


    private static async readPackageJson(): Promise<Package> {
        console.log('reading Package.json');
        let string = await fs.readFile('package.json', 'utf-8');
        return JSON.parse(string);
    }

    private static async writePackageJson(packageJson: Package): Promise<void> {
        console.log('updating Package.json');
        await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    }


    private static runNgBuild(watch: boolean): Promise<void> {
        console.log('running ng build')
        return new Promise<void>((resolve, reject) => {
            let proc = childProcess.exec(`ng build --watch=${watch} --output-path=bundle`, { maxBuffer: 1024 * 5000 }, (error, stdout, stderror) => {
                if (error) {
                    console.log(error);
                    process.exit(1);
                }
                else if (stderror) {
                    resolve();
                }
                else {
                    resolve();
                }
            });
            proc.stdout.on("data", data => {
                console.log(data);
            });
        });
    }

    private static runElectronPacker(): Promise<string[]> {
        console.log("running build");
        let targets = undefined;
        if (process.argv.indexOf('-w') > -1) {
            targets = electronBuilder.Platform.WINDOWS.createTarget();
        }
        else if (process.argv.indexOf('-l') > -1) {
            targets = electronBuilder.Platform.LINUX.createTarget();
        }
        else if (process.argv.indexOf('-m') > -1) {
            targets = electronBuilder.Platform.MAC.createTarget();
        }
        return electronBuilder.build({ targets: targets });
    }

    private static npmInstall(packages: string[]): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            npm.load({ 'save-dev': true }, (error) => {
                npm.commands.install(packages, (error, data) => {
                    if (error) {
                        console.log(error);
                        process.exit(1);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }

    private static installRequiredPackages(): Promise<void> {
        console.log('installing packages');
        return this.npmInstall(['electron', '@types/node', '@types/electron']);
    }

    private static async preparePacageJson(): Promise<void> {
        console.log('preparing package.json');
        let packageJson: Package = await this.readPackageJson();
        packageJson.main = 'bundle/electron.js';
        packageJson.build = {
            files: ['bundle/**/*']
        }
        await this.writePackageJson(packageJson);
    }

    private static async prepareIndexHtml(): Promise<void> {
        console.log('preparing index.html');
        let indexHtmlPath = path.join('src', 'index.html');
        let indexHtml = await fs.readFile(indexHtmlPath, 'utf-8');
        let updatedIndexHtml = indexHtml.replace('<base href="/">', '<base href="./">');
        await fs.writeFile(indexHtmlPath, updatedIndexHtml);
    }

    private static async prepareAngularCliConfig(): Promise<void> {
        console.log('preparing angular-cli.json');
        let angularCliConfig: AngularCliConfig = JSON.parse(await fs.readFile('.angular-cli.json','utf-8'));
        if (!angularCliConfig.apps[0].assets) {
            angularCliConfig.apps[0].assets = [];
        }
        angularCliConfig.apps[0].assets.push('electron.js');
        angularCliConfig.apps[0].outDir = "bundle";
        await fs.writeFile('.angular-cli.json', JSON.stringify(angularCliConfig, null, 2));
    }

    private static async createElectronEntryPoint(): Promise<void> {
        console.log('creating entry point');
        let sourcePath = path.join(__dirname, '..', 'res', 'electron-main.js.template');
        let targetPath = path.join('src', 'electron/electron.js');
        let template = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(targetPath, template);
    }

    private static async modifyWebpackConfig(packageJson: Package): Promise<void> {
        console.log('modifying webpack config');
        let originalConfig = await fs.readFile(this.copyConfigPath, 'utf-8');
        let nativeDependencies = ['fs', 'child_process', 'electron', 'path', 'assert', 'cluster', 'crypto', 'dns', 'domain', 'events', 'http', 'https', 'net', 'os', 'process', 'punycode',
            'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'tls', 'tty', 'dgram', 'url', 'util', 'v8', 'vm', 'zlib'];
        if (packageJson.nativeModules) {
            nativeDependencies = nativeDependencies.concat(packageJson.nativeModules);
        }
        let externalsTemplate = await fs.readFile(path.join(__dirname, '..', 'res', 'externals.template'), 'utf-8');
        let externals = externalsTemplate.replace('{ignores}', JSON.stringify(nativeDependencies));
        let newConfig = originalConfig.replace(/return ?{/g, `return {\n${externals}`);
        await fs.writeFile(this.configPath, newConfig);
    }

    private static async copyWebpackConfig(): Promise<void> {
        console.log('copying webpack config');
        let configContent = await fs.readFile(this.configPath,'utf-8');
        await fs.writeFile(this.copyConfigPath, configContent);
    }

    private static async prepare(): Promise<void> {
        await this.installRequiredPackages();
        await this.createElectronEntryPoint();
        await this.preparePacageJson();
        await this.prepareIndexHtml();
        await this.prepareAngularCliConfig();
    }

    private static async build(watch: boolean): Promise<void> {
        let packageJson = await this.readPackageJson();
        if (!await this.fileExists(this.copyConfigPath)) {
            await this.copyWebpackConfig();
        }
        await this.modifyWebpackConfig(packageJson);
        await this.runNgBuild(watch);
    }

    private static copyPackage(packageName: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            ncp(path.join(process.cwd(), 'node_modules', packageName), path.join(process.cwd(), 'bundle', 'node_modules', packageName), error => {
                if (error != undefined) {
                    console.log(error);
                    process.exit(1);
                }
                else {
                    resolve();
                }
            });
        });

    }

    private static async installNativeDependenciesIntoBuild(packageJson: Package): Promise<void> {
        let packagesToInstall: string[] = [];
        await fs.mkdir(path.join(process.cwd(),'bundle','node_modules'));
        for (let packageName of packageJson.nativeModules) {
            packagesToInstall.push(`${packageName}@${packageJson.dependencies[packageName]}`);
        }
        process.chdir('bundle');
        await this.npmInstall(packagesToInstall);
        process.chdir('..');
    }

    private static async publish(): Promise<void> {
        let packageJson = await this.readPackageJson();
        await this.build(false);
        await this.installNativeDependenciesIntoBuild(packageJson);
        await this.runElectronPacker();
    }

    static async main(): Promise<void> {
        try {
            switch (process.argv[2]) {
                case 'prepare':
                    await this.prepare();
                    break;
                case 'build':
                    let watch: boolean = process.argv[3] == '-w'
                    await this.build(watch);
                    break;
                case 'publish':
                    await this.publish();
                    break;
                default:
                    throw new Error('Invalid command');
            }
        }
        catch (error) {
            console.log(error);
        }
    }
}
Main.main();