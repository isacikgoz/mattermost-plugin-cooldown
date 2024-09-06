import {Store} from 'redux';

import {GlobalState} from '@mattermost/types/lib/store';

import { Dispatch } from "redux";
import ActionTypes from "../action_types";

import {Client4} from 'mattermost-redux/client';
import {id as pluginId} from '../manifest';

export const closeCooldownSettingsModal = () => (dispatch: Dispatch<any>) => {
    dispatch({
        type: ActionTypes.CLOSE_COOLDOWN_SETTINGS_MODAL,
    });
};

export const openCooldownSettingsModal = (channelId: string) => (dispatch: Dispatch<any>) => {
    dispatch({
        type: ActionTypes.OPEN_COOLDOWN_SETTINGS_MODAL,
        channelId,
    });
};

export async function setCooldown(channelId: string, enable: boolean, frequency_seconds: number) {
    return Client4.doFetch(`${Client4.getUrl()}/plugins/${pluginId}/cooldowns/${channelId}`, {
        method: 'post',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({enabled: enable, frequency_seconds: frequency_seconds}),
    });
}

export function fetchCooldownSettings(channelId: "") {
    return async (dispatch: Dispatch) => {
        let data;
        try {
            data = await Client4.doFetch<{enabled: boolean, frequency_seconds: number}>(
                        `${Client4.getUrl()}/plugins/${pluginId}/cooldowns/${channelId}`,
                        {method: 'get'},
                  );
        } catch (error) {
            return {error};
        }

        dispatch({
            type: ActionTypes.RECEIVED_COOLDOWN_SETTINGS,
            data,
        });

        return {data};
    };
}

export const dispatchGetCooldownForUser = (channelId: string) => (dispatch: Dispatch<any>) => {
    dispatch({
        type: ActionTypes.GET_COOLDOWN_FOR_USER,
        channelId,
    });
};

export function fetchCooldownForUser(channelId: string) {
    return async (dispatch: Dispatch) => {
        let data;
        try {
            data = await Client4.doFetch<{enabled: boolean, frequency_seconds: number, last_post_at: number}>(
                        `${Client4.getUrl()}/plugins/${pluginId}/cooldowns/${channelId}/mine`,
                        {method: 'get'},
                  );
        } catch (error) {
            return {error};
        }

        dispatch({
            type: ActionTypes.GET_COOLDOWN_FOR_USER,
            data,
        });

        return {data};
    };
}

export async function shouldSendMessage(message: any, dispatch: Dispatch<any>) {
    const data = await Client4.doFetch<{enabled: boolean, frequency_seconds: number, last_post_at: number}>(
        `${Client4.getUrl()}/plugins/${pluginId}/cooldowns/${message.channel_id}/mine`,
        {method: 'get'},
    );
    
    const channelId = message.channel_id;
    if (!data.enabled) {
        return {
            post: message,
        };
    }

    if (data.last_post_at === undefined || data.last_post_at === 0 || Date.now() - data.last_post_at > data.frequency_seconds*1000) {
        try {
            return {
                post: message,
            };
        } finally {
            setTimeout(function (){
                console.log('dispatching!');
                dispatch(fetchCooldownForUser(channelId) as any);
              }, 500)
        }
    }

    return message;
}