import { HeadData } from "./head.js";

export class Controls {
  constructor() {
    this.loadSubs = [];
    this.glassesSubs = [];

    const dataInput = document.getElementById("file-data");
    const loadBtn = document.getElementById("btn-load");

    loadBtn.addEventListener("click", async () => {
      const dataFile = dataInput.files[0];

      if (!dataFile) {
        alert("Please select a data file.");
        return;
      }

      try {
        const headData = await HeadData.load(dataFile);
        for (const sub of this.loadSubs) {
          sub(headData);
        }
      } catch (error) {
        alert("An error occurred");
        console.error(error);
      }
    });

    [
      ["translate-x", "valX"],
      ["translate-y", "valY"],
      ["translate-z", "valZ"],
    ].forEach(([sliderId, valueId]) => {
      const slider = document.getElementById(sliderId);
      const value = document.getElementById(valueId);

      value.textContent = Number(slider.value).toFixed(2);

      slider.addEventListener("input", () => {
        value.textContent = Number(slider.value).toFixed(2);
      });
    });

    document.getElementById("translate-x").addEventListener("input", (e) => {
      for (const sub of this.glassesSubs) {
        sub({ axis: 'x', value: Number(e.target.value) })
      }
    });

    document.getElementById("translate-y").addEventListener("input", (e) => {
      for (const sub of this.glassesSubs) {
        sub({ axis: 'y', value: Number(e.target.value) })
      }
    });

    document.getElementById("translate-z").addEventListener("input", (e) => {
      for (const sub of this.glassesSubs) {
        sub({ axis: 'z', value: Number(e.target.value) })
      }
    });
  }

  subscribeLoadData(fn) {
    this.loadSubs.push(fn);
  }

  subscribeGlasses(fn) {
    this.glassesSubs.push(fn);
  }
}
