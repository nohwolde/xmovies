import { MyActions } from "../actions/actions";

export const currentSeason = (state = 1,action:any) => {
    switch(action.type) {
        case MyActions.SETCURRENTSEASON:
            return action.payload
      
    

        default:
            return state
    }
}


export const currentEpisode = (state = 1,action:any) => {
    switch(action.type) {
        case MyActions.SETCURRENTEPISODE:
            return action.payload
      
    

        default:
            return state
    }
}


export const continueWatchingReducer = (state = [],action:any) => {
    switch(action.type) {
        case MyActions.SETCONTINUEWATCHING:
            // Newest first, capped so localStorage doesn't grow forever
            return [action.payload, ...state.filter((item:any) => String(item.id) !== String(action.payload.id))].slice(0, 30);
        case MyActions.GETCONTINUEWATCHING:
            return action.payload
      
    

        default:
            return state
    }
}

export const tvShowReducer = (state = [],action:any) => {
    switch(action.type) {
        case MyActions.GETCURRENTSTATES:
            return [action.payload, ...state.filter((item:any) => String(item.id) !== String(action.payload.id))].slice(0, 100)
       

        default:
            return state
    }
}