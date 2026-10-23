import { applyMiddleware, createStore } from "redux";

import thunk from "redux-thunk";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { composeWithDevTools } from "redux-devtools-extension";
import { oneReducer } from "./reducers/allReducers";
const persistConfig = {
  key: "root",
  storage,
};

const persistedReducer = persistReducer(persistConfig, oneReducer);
// Redux DevTools only in development
const enhancer = applyMiddleware(thunk);
export let Store = createStore(
  persistedReducer,
  process.env.NODE_ENV === "production" ? enhancer : composeWithDevTools(enhancer)
);
export let Persistor = persistStore(Store);
