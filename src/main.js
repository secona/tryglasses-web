import { MainView } from "./main-view.js";
import { ResultView } from "./result-view.js";
import { Controls } from "./controls.js";

const state = {
  mainView: new MainView(),
  resultView: new ResultView(),
  controls: new Controls(),
};

await state.mainView.load(state.controls);
state.mainView.run();

state.controls.subscribeRender(() => {
  state.resultView.run();
});
