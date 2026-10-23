import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { Provider } from "react-redux";
import { createStore } from "redux";
import { describe, expect, it } from "vitest";
import { usePersistedState } from "../hooks/usePersistedState";

const makeStore = (rehydrated: boolean) =>
  createStore((state: any = { MyList: [{ id: 1 }], _persist: { version: -1, rehydrated } }, action: any) =>
    action.type === "rehydrate" ? { ...state, _persist: { ...state._persist, rehydrated: true } } : state
  );

function Count() {
  const { value, ready } = usePersistedState<any[]>("MyList", []);
  return <span data-testid="count">{`${value.length}:${ready}`}</span>;
}

const app = (store: ReturnType<typeof makeStore>) => (
  <Provider store={store}>
    <Count />
  </Provider>
);

describe("usePersistedState", () => {
  it("renders the empty fallback on the server, even if the store has data", () => {
    expect(renderToString(app(makeStore(true)))).toContain("0:false");
  });

  it("stays empty on the client until the store has rehydrated", () => {
    const store = makeStore(false);
    render(app(store));
    expect(screen.getByTestId("count")).toHaveTextContent("0:false");

    act(() => {
      store.dispatch({ type: "rehydrate" });
    });
    expect(screen.getByTestId("count")).toHaveTextContent("1:true");
  });
});
