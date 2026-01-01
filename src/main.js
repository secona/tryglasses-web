import { MainView } from "./main-view.js";
import { ObjectManager }  from "./object.js";
import { ResultView } from "./result-view.js";
import { Controls } from "./controls.js";

const objectManager = new ObjectManager();

await objectManager.loadGlasses(
  "/assets/45-oculos/oculos.obj",
  "/assets/45-oculos/glasses.png",
);

const state = {
  mainView: new MainView(objectManager),
  resultView: new ResultView(objectManager),
  controls: new Controls(),
  objectManager,
};

state.mainView.load(state.controls);
state.mainView.run();

state.controls.subscribeRender(() => {
  state.resultView.run();
});
