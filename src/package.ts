export interface Package{
    main?: string;
    nativeModules?: string[]
    build?: {
        appId?: string;
        category?: string;
        asar?: boolean;
        files?: string[];
    }

}