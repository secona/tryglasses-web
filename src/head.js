import JSZip from "jszip";
import { load } from "npyjs";
import { parseOBJ } from "./util.js";

export class HeadData {
  constructor(obj, texMap, img, recon) {
    this.obj = obj;
    this.texMap = texMap;
    this.img = img;
    this.recon = recon;
  }

  static async load(dataFile) {
    const zip = await JSZip.loadAsync(dataFile);

    const objString = await zip.file("HRN_export/HRN_result.obj").async("string");
    const obj = parseOBJ(objString);

    const texMapBlob = await zip.file("HRN_export/HRN_result.jpg").async("blob");
    const texMap = URL.createObjectURL(texMapBlob);

    const imgBlob = await zip.file("HRN_export/HRN_preprocessed.jpg").async("blob");
    const imgUrl = URL.createObjectURL(imgBlob);
    const img = new Image();
    img.src = imgUrl;
    await new Promise((resolve) => { img.onload = resolve; });

    const npzData = await zip.file("HRN_recon.npz").async("arraybuffer");
    const npzZip = await JSZip.loadAsync(npzData);

    const loadNpy = async (filename) => {
      const file = npzZip.file(filename);
      const buffer = await file.async("arraybuffer");
      const result = await load(buffer)
      return result.data;
    };

    const recon = {
      trans: await loadNpy("trans.npy"),
      angle: await loadNpy("angle.npy"),
      cameraFocal: await loadNpy("camera_focal.npy"),
      cameraCenter: await loadNpy("camera_center.npy"),
      cameraDist: await loadNpy("camera_dist.npy"),
    };

    return new HeadData(obj, texMap, img, recon);
  }
}
