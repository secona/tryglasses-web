import { MainView } from "./main-view.js";
import { Controls } from "./controls.js";

const state = {
  mainView: new MainView(),
  controls: new Controls(),
};

state.mainView.load(state.controls);
state.mainView.run();
