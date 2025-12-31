import JSZip from "jszip";
import { parseOBJ } from "./util.js";

export class HeadData {
  constructor(obj, texMap) {
    this.obj = obj;
    this.texMap = texMap;
  }

  static async load(dataFile) {
    const zip = await JSZip.loadAsync(dataFile);

    const objString = await zip.file("HRN_export/HRN_result.obj").async("string");
    const obj = parseOBJ(objString);

    const texMapBlob = await zip.file("HRN_export/HRN_result.jpg").async("blob");
    const texMap = URL.createObjectURL(texMapBlob);

    return new HeadData(obj, texMap);
  }
}
