import {AssetDefinition} from "./asset-definition";
export interface AngularCliConfig{

    apps?: {
        assets?: (string | AssetDefinition)[];
        outDir?: string;
    }[];

}