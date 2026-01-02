import { MainView } from "./main-view.js";
import { ObjectManager }  from "./object.js";
import { ResultView } from "./result-view.js";
import { Controls } from "./controls.js";

const objectManager = new ObjectManager();

const state = {
  mainView: new MainView(objectManager),
  resultView: new ResultView(objectManager),
  controls: new Controls(),
  objectManager,
};

await objectManager.loadGlasses(
  "oculos",
  "/assets/45-oculos/oculos.obj",
  "/assets/45-oculos/glasses.png",
);

await objectManager.loadGlasses(
  "hearts",
  "/assets/hearts/hearts.obj",
  "/assets/hearts/hearts.png",
);

await objectManager.loadGlasses(
  "snowflake",
  "/assets/snowflake/snowflake.obj",
  "/assets/snowflake/snowflake.png",
);

objectManager.selectGlasses("oculos");
state.mainView.loadGlasses();

state.controls.subscribeSelectGlasses((name) => {
  objectManager.selectGlasses(name);

  if (objectManager.head && objectManager.glasses) {
    objectManager.glasses.parent = null;
    objectManager.head.addChild(objectManager.glasses);
  }

  state.mainView.loadGlasses();
});

state.mainView.load(state.controls);
state.mainView.run();

state.controls.subscribeRender(() => {
  state.resultView.run();
});
