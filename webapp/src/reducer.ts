import { combineReducers } from "redux";

import ActionTypes from "./action_types";

const cooldownSettingsModal = (state = { show: false, channelId: "" }, action: { type: string; channelId: string; }) => {
  switch (action.type) {
    case ActionTypes.OPEN_COOLDOWN_SETTINGS_MODAL:
      return {
        ...state,
        show: true,
        channelId: action.channelId,
      };
    case ActionTypes.CLOSE_COOLDOWN_SETTINGS_MODAL:
      return {
        ...state,
        show: false,
        channelId: "",
      };
    default:
      return state;
  }
};

function cooldownSettings(state = {channelId : ""}, action: { type: string; data: {enabled: boolean, frequency_seconds: number}; }) {
  switch (action.type) {
    case ActionTypes.RECEIVED_COOLDOWN_SETTINGS: {
      console.log('fetching cooldown settings:', action.data);
      return {
        ...state,
        cooldownSettings: action.data,
      };
    }
    default:
      return state;
  }
}

function cooldownForUser(state = {channelId : "", userId : ""}, action: { type: string; data: {enabled: boolean, frequency_seconds: number, last_post_at: number}; }) {
  switch (action.type) {
    case ActionTypes.GET_COOLDOWN_FOR_USER: {
      return {
        ...state,
        cooldownForUser: action.data,
      };
    }
    default:
      return state;
  }
}

export default combineReducers({
  cooldownSettingsModal,
  cooldownSettings,
  cooldownForUser,
});
