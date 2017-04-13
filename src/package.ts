export interface Package{
    main?: string;
    nativeModules?: string[];
    dependencies?: {[name: string]: string};
    scripts: {[name: string]: string};
    build?: {
        appId?: string;
        category?: string;
        asar?: boolean;
        files?: string[];
    }

}