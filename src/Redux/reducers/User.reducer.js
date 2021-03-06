import { USER_LOGIN, USER_LOGOUT, PHONE_AUTH_CONFIRMATION, UPDATE_FIRSTTIME } from '../constants';

const initialState = { user: null, logged: false };

const userReducer = (state = initialState, action) => {
    switch(action.type) {
        case USER_LOGIN:
            return { ...state, user: action.payload, logged: true, firstTimeLoggedIn: true };
        case USER_LOGOUT:
            return { ...state, user: null, logged: false};
        case PHONE_AUTH_CONFIRMATION:
            return { ...state, confirmation: action.payload }
        case UPDATE_FIRSTTIME:
            return { ...state , firstTimeLoggedIn: false }
        
        default:
            return state;
    }
}
export default userReducer;