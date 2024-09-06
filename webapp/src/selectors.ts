import {id as pluginId} from './manifest';

const getPluginState = (state: any) => {
    return state['plugins-' + pluginId] || {};
};

export const getCooldownSettingsModalState = (state: any) => getPluginState(state).cooldownSettingsModal;
export const getCooldownConfiguration = (state: any) => getPluginState(state).cooldownSettings;
export const getCooldownForUser = (state: any) => getPluginState(state).cooldownForUser;