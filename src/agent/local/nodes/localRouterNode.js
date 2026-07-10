export async function localRouterNode(state) {

  console.log("🔀 LOCAL ROUTER NODE");

  console.log(
    "Action:",
    state.action
  );

  console.log(
    "Iteration:",
    state.iteration
  );


  return {
    ...state
  };

}