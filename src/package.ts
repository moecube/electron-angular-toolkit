export interface Package{
    main?: string;
    build?: {
        appId?: string;
        category?: string;
        asar?: boolean;
        files?: string[];
    }

}