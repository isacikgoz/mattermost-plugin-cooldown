import {Store} from 'redux';

import {GlobalState} from '@mattermost/types/lib/store';
import ActionTypes from "./action_types";

import manifest from './manifest';

import {fetchCooldownForUser, openCooldownSettingsModal, shouldSendMessage} from './actions';

import CooldownSettingsModal from './components/cooldown_settings'
import CooldownTimer  from './components/cooldown_timer'

import Reducer from './reducer';

export default class Plugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
    public async initialize(registry: any, store: Store<GlobalState>) {
        registry.registerReducer(Reducer);
        registry.registerRootComponent(CooldownSettingsModal);
        registry.registerChannelHeaderMenuAction(
            'Cooldown Settings', 
            (channelId: string) => {
                store.dispatch(openCooldownSettingsModal(channelId) as any);
            },
        );
        registry.registerPostEditorActionComponent(CooldownTimer);
        registry.registerMessageWillBePostedHook((message: any) => {
            // const channelId = message.channel_id;
            // try {
                return shouldSendMessage(message, store.dispatch);
            // } finally {
            //     store.dispatch(fetchCooldownForUser(channelId) as any);
            // }
        });
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void
    }
}

window.registerPlugin(manifest.id, new Plugin());
