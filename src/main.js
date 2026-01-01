import { MainView } from "./main-view.js";

const state = {
  mainView: new MainView(),
};

state.mainView.load();
state.mainView.run();
