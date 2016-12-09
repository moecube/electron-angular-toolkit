#!/usr/bin/env node
import { AngularCliConfig } from './angular-cli-config';
import * as electronBuilder from 'electron-builder';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as console from 'console';
import * as npm from 'npm';
import * as process from 'process';
import * as fs from 'fs';
import { Package } from './package';
import 'core-js';
class Main {

    private static readFile(path: string): Promise<string>{
        return new Promise<string>((resolve, reject)=>{
            fs.readFile(path, 'utf-8', (error, data)=>{
                if(error){
                    reject(error);
                }
                else{
                    resolve(data);
                }
            });
        });
    }

    private static writeFile(path: string, content: string): Promise<void>{
        return new Promise<void>((resolve, reject)=>{
            fs.writeFile(path, content,error=>{
                if(error)reject(error);
                else resolve();
            });
        });
    }

    private static async readPackageJson(): Promise<Package> {
        console.log('reading Package.json');
        let string = await this.readFile('package.json');
        return JSON.parse(string);
    }

    private static async writePackageJson(packageJson: Package): Promise<void> {
        console.log('updating Package.json');
        await this.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    }

    private static readWebpackTemplate(): Promise<string> {
        console.log('loading webpack-config template');
        let templatePath = path.join(__dirname, '..', 'res', 'webpack.config.js.template');
        return this.readFile(templatePath);
    }

    private static writeWebpackConfig(content: string): Promise<void> {
        console.log('overwriting angular-cli webpack-config');
        let webpackConfigPath = path.join('node_modules', 'angular-cli', 'models', 'webpack-build-common.js')
        return this.writeFile(webpackConfigPath, content);
    }

    private static runNgBuild(watch: boolean): Promise<void> {
        console.log('running ng build')
        return new Promise<void>((resolve, reject) => {
            let proc = childProcess.exec(`ng build --watch=${watch} --output-path=bundle`, { maxBuffer: 1024 * 5000 }, (error, stdout, stderror) => {
                if (error) {
                    reject(error);
                }
                else if (stderror) {
                    reject(stderror);
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

    private static replaceExternals(webpackConfigContent: string, packageJson: Package): string {
        console.log('adding external dependencies to the webpack-config');
        let nativeDependencies = ['fs', 'child_process', 'electron', 'path', 'assert', 'cluster', 'crypto', 'dns', 'domain', 'events', 'http', 'https', 'net', 'os', 'process', 'punycode',
            'querystring', 'readline', 'repl', 'stream', 'string_decoder', 'tls', 'tty', 'dgram', 'url', 'util', 'v8', 'vm', 'zlib'];
        return webpackConfigContent.replace('{ignores}', JSON.stringify(nativeDependencies))
    }

    private static runElectronPacker(): Promise<string[]> {
        console.log("running build");
        return electronBuilder.build({});
    }

    private static installPackages(): Promise<void> {
        console.log('installing packages')
        return new Promise<void>((resolve, reject) => {
            npm.load({'save-dev': true},(error) => {
                npm.commands.install(['electron', '@types/node', '@types/electron'], (error, data) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }

    private static async preparePacageJson(): Promise<void> {
        console.log('preparing package.json');
        let packageJson: Package = await this.readPackageJson();
        packageJson.main = 'bundle/electron-main.js';
        packageJson.build = {
            files: ['bundle/**/*']
        }
        await this.writePackageJson(packageJson);
    }

    private static async prepareIndexHtml(): Promise<void>{
        console.log('preparing index.html');
        let indexHtmlPath = path.join('src','index.html');
        let indexHtml = await this.readFile(indexHtmlPath);
        let updatedIndexHtml = indexHtml.replace('<base href="/">', '<base href="./">');
        await this.writeFile(indexHtmlPath, updatedIndexHtml);
    }

    private static async prepareAngularCliConfig(): Promise<void>{
        console.log('preparing angular-cli.json');
        let angularCliConfig: AngularCliConfig = JSON.parse(await this.readFile('angular-cli.json'));
        if(!angularCliConfig.apps[0].assets){
            angularCliConfig.apps[0].assets = [];
        }
        angularCliConfig.apps[0].assets.push('electron-main.js');
        angularCliConfig.apps[0].outDir="bundle";
        await this.writeFile('angular-cli.json', JSON.stringify(angularCliConfig, null, 2));
    }

    private static async createElectronEntryPoint(): Promise<void> {
        console.log('creating entry point');
        let sourcePath = path.join(__dirname, '..', 'res', 'electron-main.js.template');
        let targetPath = path.join('src', 'electron-main.js');
        let template = await this.readFile(sourcePath);
        await this.writeFile(targetPath, template);
    }

    private static async prepare(): Promise<void> {
        await this.installPackages();
        await this.createElectronEntryPoint();
        await this.preparePacageJson();
        await this.prepareIndexHtml();
        await this.prepareAngularCliConfig();
    }

    private static async build(watch: boolean): Promise<void> {
        let webpackConfigTemplate = await this.readWebpackTemplate();
        let packageJson = await this.readPackageJson();
        let webpackConfig = this.replaceExternals(webpackConfigTemplate, packageJson);
        await this.writeWebpackConfig(webpackConfig);
        await this.runNgBuild(watch);
    }

    private static async publish(): Promise<void> {
        await this.build(false);
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