export class ResultView {
  constructor() {
    const canvas = document.getElementById("render-canvas");
    this.canvas = canvas;

    const gl = canvas.getContext("webgl2");
    this.gl = gl;

    const modal = document.getElementById("render-modal");
    this.modal = modal;

    document.getElementById("btn-close-modal").addEventListener("click", () => {
      modal.style.display = "none";
    });

    document.getElementById("btn-close-modal-2").addEventListener("click", () => {
      modal.style.display = "none";
    });

    document.getElementById("btn-save-render").addEventListener("click", () => {
      const link = document.createElement("a");
      link.download = "glasses_render.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  }

  run() {
    this.modal.style.display = "flex";
  }
}
